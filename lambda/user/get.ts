import { APIGatewayEvent, Callback } from 'aws-lambda';
import { DefaultApi, User } from 'gen';

export const getUser = (event: APIGatewayEvent): User => {
  return { id: '00000', name: 'suzuxander' };
}
