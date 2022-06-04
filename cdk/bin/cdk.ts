#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import * as jsYaml from 'js-yaml';
import { readFileSync } from 'fs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as fs from 'fs';

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

const accountId = process.env.ACCOUNT_ID;
if (!accountId) throw new Error('process.env.ACCOUNT_ID is required.');

const region = process.env.REGION ?? 'ap-northeast-1';
const apiType = process.env.API_TYPE ? 'API_KEY_SECURITY' : 'SIMPLE';

const createOpenApiYaml = (input: string, output: string): OpenApi => {
  const yaml = readFileSync(input).toString()
    .replace(/\{ACCOUNT_ID}/g, accountId)
    .replace(/\{REGION}/g, region);
  fs.writeFileSync(output, yaml);
  return jsYaml.load(yaml) as OpenApi;
};

const createSimpleApiStack = (): void => {
  let inputOpenapiName = '../openapi/simple/openapi.yaml';
  if (apiType === 'API_KEY_SECURITY') {
    inputOpenapiName = '../openapi/apikey/openapi.yaml';
  }
  const outputOpenapiName = 'openapi.yaml';
  const openapi = createOpenApiYaml(inputOpenapiName, './cdk.out/' + outputOpenapiName);

  const app = new cdk.App();

  const stack = new CdkStack(app, 'api-gateway-sample', {
    env: { region }
  });

  const api = stack.api('Api', {
    name: 'api-gateway-sample-api',
    stageName: 'dev',
    definitionUri: './' + outputOpenapiName,
  });

  const role = stack.serviceRole('LambdaServiceRole', {
    roleName: 'api-gateway-sample-lambda-service-role',
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

  if (apiType === 'API_KEY_SECURITY') {
    stack.createApiKey('ApiKey', {
      keyName: 'api-gateway-sample-api-key',
      stageName: 'dev',
      apiId: api.ref
    });
  }
};

createSimpleApiStack();

