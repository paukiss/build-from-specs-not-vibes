import express from 'express';

const app = express();
app.use(express.json());

app.get('/', (_req, res) => res.send({ status: 'ok' }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`backend listening on ${port}`);
});

export default app;
