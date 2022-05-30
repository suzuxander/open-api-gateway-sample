import { APIGatewayEvent, Callback } from 'aws-lambda';
import { getUser, postUser } from './user';

const execute = (event: APIGatewayEvent): any => {
  const { path, httpMethod } = event;
  if (path === 'user/{path}') {
    if (httpMethod === 'get') {
      return getUser(event);
    }
    if (httpMethod === 'post') {
      return postUser(event);
    }
  }
  throw new Error('Not Found.');
};

export const handler = (event: APIGatewayEvent, context: any, callback: Callback) => {
  try {
    const result = execute(event);
    return callback(null, result);
  } catch (e) {
    return callback(null, e);
  }
};

