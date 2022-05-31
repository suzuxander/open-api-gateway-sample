import { Configuration, DefaultApi } from 'gen';

const exec = async () => {
  const api = new DefaultApi({
    basePath: process.env.BASE_PATH as string
  } as Configuration);

  const res = await api.userIdGet('1');
  console.log(res.data);
}

(async () => exec())();