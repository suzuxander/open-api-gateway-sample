#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import * as jsYaml from 'js-yaml';
import { readFileSync } from 'fs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

interface OpenApi {
  paths: {
    [path: string]: {
      [method: string]: {
        'x-amazon-apigateway-integration': {
          uri: string
        }
      }
    }
  }
}

const app = new cdk.App();
const stack = new CdkStack(app, 'open-api-gateway-generator', {
  env: { region: 'ap-northeast-1' }
});
const api = stack.api('Api', {
  name: 'open-api-gateway-generator-api',
  stageName: 'dev',
  definitionUri: '../../openapi.yaml',
});

const role = stack.lambdaServiceRole('LambdaServiceRole', {
  roleName: 'open-api-gateway-generator-api-service-role',
});

const openapi = jsYaml.load(readFileSync('../openapi.yaml').toString()) as OpenApi;
Object.keys(openapi.paths).forEach(path => {
  Object.keys(openapi.paths[path]).forEach(method => {
    const { uri } = openapi.paths[path][method]['x-amazon-apigateway-integration'];
    const functionName = (uri.split(':').pop() as string).split('/').shift() as string;

    stack.lambdaFunction((functionName).replace(/-/g, ''), {
      functionName,
      runtime: Runtime.NODEJS_16_X,
      role: role.ref,
      codeUri: '../../lambda',
      handler: 'dist/index.js',
      timeout: 30,
      event: { api: { path, method, restApiId: api.ref } }
    })
  });
});
