import { Hono } from 'hono';
import routes from './routes';

const app = new Hono();

app.route('/api', routes);

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

export default app;