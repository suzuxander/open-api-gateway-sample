import { Configuration, DefaultApi } from 'gen/apikey';

if (!process.env.BASE_PATH) throw new Error('process.env.BASE_PATH is required.');
if (!process.env.BASE_PATH) throw new Error('process.env.API_KEY is required.');

const exec = async () => {
  const api = new DefaultApi({
    basePath: process.env.BASE_PATH as string,
    apiKey: process.env.API_KEY as string,
  } as Configuration);

  const res = await api.userIdDelete('1');
  console.log('status:', res.status);
  console.log('response:', res.data);
}

(async () => exec())();