import express from 'express';
import { Logger } from './utils/Logger';
import config from './config';
import compression from 'compression';
const app = express();

(async () => {
	app
		.use(compression())
		.use((req, res, next) => {
			if (req.originalUrl !== '/favicon.ico') Logger.connection(req, res);
			next();
		})
		.use(express.json())
		.use('/', (await import('./routes/index')).default())
		.use('/file', (await import('./routes/file')).default())
		.listen(config.port, () => Logger.log(`Started on PORT: ${config.port}`));
})();
