import { Stack, StackProps, aws_lambda_nodejs, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnApi, CfnFunction } from 'aws-cdk-lib/aws-sam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { CfnRole, Role } from 'aws-cdk-lib/aws-iam';
import { CfnApiKey, CfnUsagePlan, CfnUsagePlanKey, IRestApi, RestApiBase } from 'aws-cdk-lib/aws-apigateway';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  }

  public api = (id: string, options: {
    name: string,
    stageName: string,
    definitionUri: string
  }): CfnApi => {
    const {
      name, stageName, definitionUri
    } = options;
    return new CfnApi(this, id, {
      stageName,
      name,
      definitionUri,
    });
  };

  public apiV2 = (id: string, options: {
    name: string,
    stageName?: string,
    definitionPath: string
  }): apigateway.SpecRestApi => {
    const {
      name, stageName, definitionPath
    } = options;
    return new apigateway.SpecRestApi(this, id, {
      restApiName: name,
      apiDefinition: apigateway.ApiDefinition.fromAsset(definitionPath),
      deployOptions: {
        stageName,
      },
      cloudWatchRole: false
    });
  };

  public createDeployStage = (id: string, options: {
    stageName: string,
    api: apigateway.IRestApi
  }): apigateway.Stage => {
    const {
      stageName, api
    } = options;

    return new apigateway.Stage(this, id, {
      stageName,
      deployment: new apigateway.Deployment(this, 'ApiDeployment', {
        api,
      })
    });
  }

  public lambdaFunction = (id: string, options: {
    codeUri: string,
    handler: string,
    role: string,
    runtime: Runtime,
    functionName?: string,
    layers?: string[],
    timeout?: number,
    memorySize?: number,
    event?: { api?: { method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, restApiId: string } }
  }) => {
    const {
      codeUri,
      handler,
      role,
      functionName,
      layers,
      runtime,
      timeout,
      memorySize,
      event
    } = options;

    let _event: any = {};
    if (event && event.api) {
      const { method, path, restApiId } = event.api;
      _event['api'] = {
        type: 'Api',
        properties: {
          method,
          path,
          restApiId
        }
      }
    }

    return new CfnFunction(this, id, {
      codeUri,
      handler,
      role,
      functionName,
      layers,
      runtime: runtime.toString(),
      timeout,
      memorySize,
      events: _event
    })
  };


  public lambdaFunctionV2 = (id: string, options: {
    // codeUri: string,
    entry: string,
    handler: string,
    role: Role,
    runtime: Runtime,
    functionName?: string,
    layers?: string[],
    timeout?: number,
    memorySize?: number,
    event?: { api?: { method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, restApiId?: string } }
  }) => {
    const {
      // codeUri,
      entry,
      handler,
      role,
      functionName,
      layers,
      runtime,
      timeout,
      memorySize,
      event
    } = options;

    // let events: eventSources.ApiEventSource[] = [];
    // if (event && event.api) {
    //   events = [
    //     new eventSources.ApiEventSource(
    //       event.api.method,
    //       event.api.path,
    //
    //     )
    //   ];
    // }

    return new lambdaNodeJs.NodejsFunction(this, id, {
      functionName,
      // entry: '../dist/user/get/index.js',
      entry,
      handler,
      runtime,
      role,
      timeout: timeout ? Duration.minutes(timeout) : undefined,
      memorySize,
      // events,
      bundling: {
        tsconfig: '../tsconfig.json'
      }
    });
  };

  public serviceRole = (id: string, options: {
    roleName: string,
    assumeRolePolicy: { service: string[] },
    policy?: { name?: string, statement: { effect: 'Allow' | 'Deny', action: string[], resource: string[] }[] },
  }): CfnRole => {
    const {
      roleName,
      assumeRolePolicy,
      policy,
    } = options;

    let policies: any[] = [];
    if (policy) {
      policies = [{
        policyName: policy.name ?? 'policy',
        policyDocument: {
          Statement: policy.statement.map(st => (
            {
              Action: st.action,
              Effect: st.effect,
              Resource: st.resource
            }
          )),
          Version: '2012-10-17'
        }
      }];
    }

    return new CfnRole(this, id, {
      roleName,
      assumeRolePolicyDocument: {
        Statement: [{
          Action: [ 'sts:AssumeRole' ],
          Effect: 'Allow',
          Principal: {
            Service: assumeRolePolicy.service
          }
        }],
        Version: '2012-10-17'
      },
      policies
    });
  };

  public lambdaServiceRole = (id: string, options: {
    roleName?: string
  }): iam.Role => {
    const { roleName } = options;

    return new iam.Role(this, id, {
      // roleName: 'open-api-gateway-sample-lambda-service-role',
      roleName,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com', ),
      inlinePolicies: {
        'policy': new iam.PolicyDocument({
          statements: [new iam.PolicyStatement({
            actions: [ 'logs:*' ],
            effect: iam.Effect.ALLOW,
            resources: [ '*' ]
          })]
        })
      }
    });
  };

  public createApiKey = (id: string, options: {
    stageName: string,
    apiId: string,
    keyName: string,
    keyValue?: string
  }): CfnApiKey => {
    const {
      stageName,
      apiId,
      keyName,
      keyValue
    } = options;
    const apiKey = new CfnApiKey(this, id, {
      name: keyName,
      value: keyValue,
      // description,
      enabled: true,
      stageKeys: [{
        restApiId: apiId,
        stageName
      }]
    });
    const usagePlan = new CfnUsagePlan(this, id + 'UsagePlan', {
      usagePlanName: keyName + '-usage-plan',
      apiStages: [{
        apiId: apiId,
        stage: stageName
      }]

    });
    new CfnUsagePlanKey(this, id + 'UsagePlanKey', {
      keyId: apiKey.ref,
      keyType: 'API_KEY',
      usagePlanId: usagePlan.ref
    });

    return apiKey;
  };

  public createApiKeyV2 = (id: string, options: {
    keyName: string,
    api: apigateway.RestApiBase,
    stage: apigateway.Stage
  }): void => {
    const { keyName, api, stage } = options;
    const apiKey = api.addApiKey(id, {
      // apiKeyName: 'open-api-gateway-sample-api-key',
      apiKeyName: keyName
    });

    api.addUsagePlan('ApiKeyUsagePlan', {
      name: keyName + '-usage-plan',
      apiStages: [{
        api: api,
        stage,
      }]
    }).addApiKey(apiKey);
  }
}
