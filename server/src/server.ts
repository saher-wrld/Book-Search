import express from 'express';
import path from 'node:path';
import type { Request, Response } from 'express';

import db from './config/connection.js';

import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4';
import { authenticateToken } from './services/auth-services.js';
import { typeDefs, resolvers } from './schemas/index.js';


// add these lines to make __dirname work
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// END - add these lines to make __dirname work

const app = express();
const PORT = process.env.PORT || 3001;
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const startApolloServer = async () => {
  await server.start();
  await db;

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use('/graphql', expressMiddleware(server as any,
    {
      context: authenticateToken as any
    }
  ));

  // if we're in production, serve client/build as static assets
  if (process.env.NODE_ENV === 'production') {
    console.log(__dirname);
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
  });

}

startApolloServer();

//app.use(routes);