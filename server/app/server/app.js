import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { requireEnvBoolean } from '../../core/env';
import { errorHandler, defaultNotFound, errorConfig } from '../../src/shared/error';
import swaggerSpec from '../../src/shared/swagger';
import { favicon } from '../../src/shared/express';
import '../../src/sequelize/models';
import { logger, logRequest } from '../../src/shared/logging';
import { router } from '../../src/router';
import {
  sequelizeUniqueConstraintErrorAdapter,
  sequelizeForeignConstraintErrorAdapter,
  sequelizeValidationErrorAdapter,
} from '../../src/shared/db';
import { ioErrorAdapter } from '../../src/shared/io';

/**
  Comment out these imports if you want to use them
  Before commenting out them first check how they are implemented
  and if they are suitable for you
 */
// import { authenticate } from '../../src/shared/auth';
// import { loadAuthenticatedAccount } from '../../src/account/middleware';

const app = express();
app.disable('x-powered-by');
app.enable('trust proxy', true);

app.use(cors());
app.options('*', cors());

app.use(favicon());
app.get('/swagger.json', (req, res) => {
  res.send(swaggerSpec);
});
app.use(express.static(path.join(__dirname, '../../public')));

const shouldLogRequests = requireEnvBoolean('LOG_API_REQUESTS', false);
if (shouldLogRequests) app.use(logRequest());

// app.use(authenticate());
// app.use(loadAuthenticatedAccount());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use('/', router);

app.use(defaultNotFound());

const errorHandlerOptions = {
  showFullError: errorConfig.showFullError,
  customAdapters: [
    sequelizeUniqueConstraintErrorAdapter,
    sequelizeForeignConstraintErrorAdapter,
    sequelizeValidationErrorAdapter,
    ioErrorAdapter,
  ],
};

app.use(errorHandler(errorHandlerOptions), (err, req, res, next) => {
  logger.error({ err, req });
  next();
});

export default app;
