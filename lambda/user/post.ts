import { APIGatewayEvent, Callback } from 'aws-lambda';
import { lambdaHandler } from 'lambda/common';

export const main = (event: APIGatewayEvent): void => {
  return;
}

export const handler = (event: APIGatewayEvent, context: any, callback: Callback) => {
  return lambdaHandler(event, callback, main);
};