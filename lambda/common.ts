import { APIGatewayEvent, Callback } from 'aws-lambda';

type MainLogic = (event: APIGatewayEvent) => any;

export const lambdaHandler = (event: APIGatewayEvent, callback: Callback, mainLogic: MainLogic): any => {
  try {
    const result = mainLogic(event);
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify(result ? result : { message: 'OK' })
    });
  } catch (e: any) {
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: e.message })
    });
  }
};

