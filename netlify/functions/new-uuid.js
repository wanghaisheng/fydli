import { randomUUID } from 'crypto';

exports.handler = async (event, context) => {

	return {
    statusCode: 200,
    body: randomUUID()
  }

};
