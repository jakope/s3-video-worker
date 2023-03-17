import morgan from "morgan";
import { environment } from "./env.js";
import logger from "./logger.js";

morgan.token('message', (req, res) => res.locals.errorMessage || '');

const getIpFormat = () =>
  environment === 'production' ? ':remote-addr -' : '';
const successResponseFormat = `[:method - :status - :response-time ms] ${getIpFormat()} :url`;
const errorResponseFormat = `[:method - :status - :response-time ms] ${getIpFormat()} :url - message: :message`;

const successHandler = morgan(successResponseFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

const errorHandler = morgan(errorResponseFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});

export default  {
  successHandler,
  errorHandler,
};
