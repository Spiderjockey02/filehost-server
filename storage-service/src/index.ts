import express from 'express';
import { Logger } from './utils/Logger';
import config from './config';
const app = express();

(async () => {
	app
		.use((req, res, next) => {
			if (req.originalUrl !== '/favicon.ico') Logger.connection(req, res);
			next();
		})
		.use('/', (await import('./routes/index')).default())
		.listen(config.port, () => Logger.log(`Started on PORT: ${config.port}`));
})();
