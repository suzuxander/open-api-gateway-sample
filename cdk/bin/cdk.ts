#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import * as jsYaml from 'js-yaml';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

interface OpenApi {
  paths: {
    [path: string]: {
      [method: string]: {
        description: string
        'x-amazon-apigateway-integration': {
          uri: string
        }
      }
    }
  }
}

const ACCOUNT_ID = process.env.ACCOUNT_ID;
if (!ACCOUNT_ID) throw new Error('process.env.ACCOUNT_ID is required.');

const REGION = process.env.REGION ?? 'ap-northeast-1';
const API_TYPE = process.env.API_TYPE === 'API_KEY_SECURITY' ? 'API_KEY_SECURITY' : 'SIMPLE';
const DEPLOY_STAGE = process.env.DEPLOY_STATGE ?? 'dev';
const DEPLOY_TYPE = process.env.DEPLOY_TYPE === 'SAM' ? 'SAM' : 'CDK';

const createOpenApiYaml = (input: string, output: string): OpenApi => {
  const yaml = readFileSync(input).toString()
    .replace(/\{ACCOUNT_ID}/g, ACCOUNT_ID)
    .replace(/\{REGION}/g, REGION);
  fs.writeFileSync(output, yaml);
  return jsYaml.load(yaml) as OpenApi;
};

const kebabToCamel = (str: string): string => {
  const _str = str.replace(/-./g, (v) => v.charAt(1).toUpperCase())
  return _str.replace(/^./, _str.charAt(0).toUpperCase());
};

const createSamApiStack = (): void => {
  let inputOpenapiName = '../openapi/sam/simple/openapi.yaml';
  if (API_TYPE === 'API_KEY_SECURITY') {
    inputOpenapiName = '../openapi/sam/apikey/openapi.yaml';
  }
  const outputOpenapiName = 'openapi.yaml';
  const openapi = createOpenApiYaml(inputOpenapiName, './cdk.out/' + outputOpenapiName);

  const app = new cdk.App();

  const stack = new CdkStack(app, 'open-api-gateway-sample', {
    env: { region: REGION }
  });

  const api = stack.api('Api', {
    name: 'open-api-gateway-sample-api',
    stageName: 'dev',
    definitionUri: './' + outputOpenapiName,
  });

  const role = stack.serviceRole('LambdaServiceRole', {
    roleName: 'open-api-gateway-sample-lambda-service-role',
    assumeRolePolicy: { service: ['lambda.amazonaws.com'] },
    policy: {
      statement: [{
        action: [ 'logs:*' ],
        effect: 'Allow',
        resource: [ '*' ]
      }]
    }
  });

  Object.keys(openapi.paths).forEach(path => {
    Object.keys(openapi.paths[path]).forEach(method => {
      const { uri } = openapi.paths[path][method]['x-amazon-apigateway-integration'];
      const functionName = (uri.split(':').pop() as string).split('/').shift() as string;

      stack.lambdaFunction((functionName).replace(/-/g, ''), {
        functionName,
        runtime: Runtime.NODEJS_16_X,
        role: role.attrArn,
        codeUri: '../../dist/' + openapi.paths[path][method].description, // TODO
        handler: 'index.handler',
        timeout: 30,
        event: {
          api: {
            path,
            method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE',
            restApiId: api.ref
          }
        }
      })
    });
  });

  if (API_TYPE === 'API_KEY_SECURITY') {
    stack.createApiKey('ApiKey', {
      keyName: 'open-api-gateway-sample-api-key',
      stageName: 'dev',
      apiId: api.ref
    });
  }
};

const createSimpleApiStack = (): void => {
  let inputOpenapiName = '../openapi/simple/openapi.yaml';
  if (API_TYPE === 'API_KEY_SECURITY') {
    inputOpenapiName = '../openapi/apikey/openapi.yaml';
  }
  const outputOpenapiName = 'openapi.yaml';
  const openapi = createOpenApiYaml(inputOpenapiName, './cdk.out/' + outputOpenapiName);

  const app = new cdk.App();

  const stack = new CdkStack(app, 'open-api-gateway-sample', {
    env: { region: REGION }
  });

  const api = stack.apiV2('Api', {
    name: 'open-api-gateway-sample-api',
    definitionPath: './cdk.out/' + outputOpenapiName,
    stageName: DEPLOY_STAGE,
  })

  const role = stack.lambdaServiceRole('LambdaServiceRole', {
    roleName: 'open-api-gateway-sample-lambda-service-role'
  });

  Object.keys(openapi.paths).forEach(path => {
    Object.keys(openapi.paths[path]).forEach(method => {
      const { uri } = openapi.paths[path][method]['x-amazon-apigateway-integration'];
      const functionName = (uri.split(':').pop() as string).split('/').shift() as string;

      const func = stack.lambdaFunctionV2((kebabToCamel(functionName)).replace(/-/g, ''), {
        functionName,
        entry: openapi.paths[path][method].description,
        runtime: Runtime.NODEJS_16_X,
        handler: 'handler',
        role,
      });
      func.addPermission('Permission', {
        action: 'lambda:InvokeFunction',
        sourceArn: api.arnForExecuteApi(method.toUpperCase(), path, 'dev'),
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com', ),
      });
    });
  });

  if (API_TYPE === 'API_KEY_SECURITY') {
    stack.createApiKeyV2('ApiKey', {
      keyName: 'open-api-gateway-sample-api-key',
      api,
      stage: api.deploymentStage,
    });
  }
};

if (DEPLOY_TYPE === 'SAM') {
  createSamApiStack();
} else {
  createSimpleApiStack();
}
