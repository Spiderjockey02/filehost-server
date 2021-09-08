// pkg
const express = require('express'),
	cors = require('cors'),
	app = express(),
	port = 1111,
	helmet = require('helmet'),
	favicon = require('serve-favicon'),
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
	.use(helmet())
	.use(cors(corsOpt))
	.use(compression())
	.engine('html', require('ejs').renderFile)
	.set('view engine', 'ejs')
	.use(favicon('./assets/favicon.ico'))
	.get('/favicon.ico', (req, res) => res.status(200).sendFile(assets + '/favicon.ico'))
	.get('/robots.txt', (req, res) => res.sendFile(assets + '/robots.txt'))
	.get('/', (req, res) => res.status(200).render('index'))
	.use('/files', require('./router/files'))
	.listen(port, () => console.log(`Started on PORT: ${port}`));
