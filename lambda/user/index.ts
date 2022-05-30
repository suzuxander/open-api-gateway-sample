import { APIGatewayEvent } from 'aws-lambda';
import { GetUserResponse } from 'gen';

export const getUser = (event: APIGatewayEvent): GetUserResponse => {
  return { id: '00000', name: 'suzuxander' };
}

export const postUser = (event: APIGatewayEvent): void => {
  return;
}