import { APIGatewayEvent, Callback } from 'aws-lambda';
import { GetUserResponse } from 'gen/simple';
import { lambdaHandler } from 'lambda/common';

const main = (event: APIGatewayEvent): GetUserResponse => {
  return { id: '00000', name: 'suzuxander' };
}

export const handler = (event: APIGatewayEvent, context: any, callback: Callback) => {
  return lambdaHandler(event, callback, main);
};