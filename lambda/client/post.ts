import { Configuration, DefaultApi } from 'gen/simple';

if (!process.env.BASE_PATH) throw new Error('process.env.BASE_PATH is required.');

const exec = async () => {
  const api = new DefaultApi({
    basePath: process.env.BASE_PATH as string
  } as Configuration);

  const res = await api.userPost({ id: '1', name: 'suzuxander' });
  console.log('status:', res.status);
  console.log('response:', res.data);
}

(async () => exec())();