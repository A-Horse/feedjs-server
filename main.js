import listenFeed from 'feedjs';
import express from 'express';
import path from 'path';
import { getAtoms, createTablesIfNotExsits, insertToAtom } from './lib/db';
import colors from 'colors';

const startServer = async () => {
  await createTablesIfNotExsits();
  listenFeed(async feeds => {
    await Promise.all(feeds.map(insertToAtom));
  });
};

const app = express();

app.get('/alive', (req, res) => {
  res.send('I am alive');
});

app.get('/new-unread/:number', async (req, res) => {
  const atoms = await getAtoms(req.params.number);
  res.json(atoms);
});

app.listen(7788);

startServer();
console.log(colors.green(`server start at http://127.0.0.1:7788`));
