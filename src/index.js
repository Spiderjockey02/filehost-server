// pkg
const express = require('express'),
	cors = require('cors'),
	app = express(),
	helmet = require('helmet'),
	favicon = require('serve-favicon'),
	config = require('./config.js'),
	compression = require('compression');

const corsOpt = {
	origin: '*',
	credentials: true,
	methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version'],
	optionsSuccessStatus: 204,
};

const	assets = __dirname + '/assets';

// normal configuration
app
	.use(helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ['\'self\''],
				'script-src': ['\'unsafe-inline\'', 'https://kit.fontawesome.com', 'https://cdn.jsdelivr.net', 'https://ajax.googleapis.com'],
				'style-src': ['\'unsafe-inline\'', 'https://cdn.jsdelivr.net'],
				'connect-src': ['\'unsafe-inline\'', 'https://ka-f.fontawesome.com/', 'https://cdn.jsdelivr.net'],
				'font-src': ['\'unsafe-inline\'', 'https://ka-f.fontawesome.com'],
				'img-src': ['\'unsafe-inline\'', 'https://www.freeiconspng.com', config.domain],
			},
		},
	}))
	.use(cors(corsOpt))
	.use(compression())
	.use(function(req, res, next) {
		if (req.originalUrl !== '/favicon.ico') {
			console.log(`IP: ${(req.connection.remoteAddress == '::1') ? '127.0.0.1' : req.connection.remoteAddress.slice(7)} -> ${req.originalUrl}`);
		}
		next();
	})
	.engine('html', require('ejs').renderFile)
	.set('view engine', 'ejs')
	.set('views', './src/views')
	.use(favicon(assets + '/favicon.ico'))
	.get('/robots.txt', (req, res) => res.sendFile(assets + '/robots.txt'))
	.get('/', (req, res) => res.status(200).render('index'))
	.use('/files', require('./router/files'))
	.listen(config.port, () => console.log(`Started on PORT: ${config.port}`));
