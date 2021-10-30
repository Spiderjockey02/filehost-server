// dependecies
const express = require('express'),
	cors = require('cors'),
	app = express(),
	helmet = require('helmet'),
	favicon = require('serve-favicon'),
	config = require('./config.js'),
	passport = require('passport'),
	mongoose = require('mongoose'),
	session = require('express-session'),
	MemoryStore = require('memorystore'),
	mStore = MemoryStore(session),
	bodyParser = require('body-parser'),
	{ logger } = require('./utils'),
	fs = require('fs'),
	https = require('https'),
	http = require('http'),
	compression = require('compression');
require('./website/config/passport')(passport);

// IF the mail service should be enabled for verifing emails
if (config.mailService.enable) require('./mailservice')();

// Connect to database
mongoose.connect(config.MongoDBURl, { useNewUrlParser: true, useUnifiedTopology : true })
	.then(() => {
		logger.log('Connected to database', 'ready');
	});

// normal configuration
app
	.use(helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ['\'self\''],
				'script-src': ['\'unsafe-inline\'', 'https://kit.fontawesome.com', config.domain, 'https://cdn.jsdelivr.net', 'https://unpkg.com',
					'https://cdnjs.cloudflare.com', 'https://arc.io', 'https://static.arc.io', 'https://tracker.arc.io/', 'https://www.paypal.com', 'https://static.cloudflareinsights.com'],
				'style-src': ['\'unsafe-inline\'', config.domain, 'https://fonts.googleapis.com', 'https://unpkg.com', 'https://cdnjs.cloudflare.com',
					'https://cdn.jsdelivr.net', 'https://static.arc.io' ],
				'connect-src': ['\'unsafe-inline\'', 'https://ka-f.fontawesome.com/', config.domain, 'https://cdn.jsdelivr.net', 'https://unpkg.com',
					'https://cdnjs.cloudflare.com', 'https://kit.fontawesome.com', 'wss://tkr.arc.io', 'https://static.arc.io', 'https://gateway.arc.io',
					'https://warden.arc.io', 'https://arc.io', 'https://tracker.arc.io/', 'https://www.google-analytics.com', 'https://storage.arc.io',
					'wss://socket.arc.io', 'https://www.paypal.com', 'https://static.cloudflareinsights.com', 'https://cloudflareinsights.com'],
				'font-src': ['\'unsafe-inline\'', 'https://ka-f.fontawesome.com', 'data:', config.domain, 'https://fonts.gstatic.com',
					'https://cdnjs.cloudflare.com', 'https://unpkg.com', 'https://static.arc.io'],
				'img-src': ['\'unsafe-inline\'', 'https://www.freeiconspng.com', config.domain, 'data:', 'https://www.tenforums.com', 'https://static.arc.io',
					'https://storage.arc.io', 'https://lh3.googleusercontent.com', 'https://t.paypal.com'],
				'media-src': ['\'unsafe-inline\'', config.domain],
				'frame-src': ['\'unsafe-inline\'', config.domain, ...config.frame_domains, 'https://core.arc.io', 'https://www.paypal.com/'],
			},
		},
	}))
	.use(cors({
		origin: '*',
		credentials: true,
		methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version'],
		optionsSuccessStatus: 204,
	}))
	.use(compression())
	.use(bodyParser.urlencoded({ extended: true }))
	.use(bodyParser.json())
	.use(session({
		store:  new mStore({ checkPeriod: 86400000 }),
		secret: 'secret',
		resave: false,
		saveUninitialized: false,
	}))
	.use(passport.initialize())
	.use(passport.session())
	.use(function(req, res, next) {
		if (req.originalUrl !== '/favicon.ico') logger.connection(req, res);
		next();
	})
	.engine('html', require('ejs').renderFile)
	.set('view engine', 'ejs')
	.set('views', './src/website/views')
	.use(express.static('./src/website/public'))
	.use(favicon('./src/website/assets/favicon.ico'))
	.use(require('./website/config/RateLimit').connectionLimiter)
	.use('/', require('./website/router'))
	.use('/files', require('./website/router/files'))
	.use('/user', require('./website/router/user'))
	.use('/auth', require('./website/router/auth'))
	.use('/social', require('./website/router/social'))
	.use('/api', require('./website/router/api'))
	.use('/admin', require('./website/router/admin'))
	.use(function(error, req, res, next) {
		res.status(500);
		res.render('500-page', { title:'500: Internal Server Error', error: error });
	})
	.get('*', function(req, res) {
		res
			.status(404)
			.render('404-page', {
				user: req.isAuthenticated() ? req.user : null,
				company: config.company,
			});
	});

if (config.secure) {
	try {
		// Create an HTTP service.
		http.createServer(function(req, res) {
			res.writeHead(301, { 'Location': 'https://' + req.headers['host'] + req.url });
			res.end();
		})
			.listen(80, () => logger.log('HTTP server online (port: 80)', 'ready'));

		// Create an HTTPS service identical to the HTTP service.
		https
			.createServer({
				key: fs.readFileSync('./src/client-key.pem'),
				cert: fs.readFileSync('./src/client-cert.pem'),
			}, app)
			.listen(443, () => logger.log('HTTPS server online (port: 443)', 'ready'));
	} catch (err) {
		console.log(`HTTPS server not online due to ${err.message}`);
	}
} else {
	// Create an HTTP service.
	http
		.createServer(app)
		.listen(80, () => logger.log('HTTP server online (port: 80)', 'ready'));
}
