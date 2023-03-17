// import "./auth/init";
import { environment, PORT } from './config/env.js';

/* express */
import express from "express";
import morgan from './config/morgan.js';
import cors from 'cors';
import helmet from 'helmet';
import router from './router.js';

const app = express();

app.set('port', PORT || 6789);
app.set('view engine', 'ejs');

if (environment !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

app.use(helmet());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    maxAge: 3600,
  })
);

app.use(router);

app.listen(app.get('port'));
console.log('App listening on ' + app.get('port'));
