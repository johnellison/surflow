import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => {
  return c.json({ name: 'Surflow API', version: '0.0.1', status: 'ok' });
});

// Route groups will be added as features are built
// app.route('/forecast', forecastRoutes);
// app.route('/spots', spotRoutes);
// app.route('/auth', authRoutes);

export default app;
