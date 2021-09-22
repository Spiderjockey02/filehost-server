// dependecies
const express = require('express'),
	cors = require('cors'),
	app = express(),
	helmet = require('helmet'),
	favicon = require('serve-favicon'),
	config = require('./config.js'),
	fileUpload = require('express-fileupload'),
	passport = require('passport'),
	mongoose = require('mongoose'),
	session = require('express-session'),
	MemoryStore = require('memorystore'),
	mStore = MemoryStore(session),
	bodyParser = require('body-parser'),
	{ logger } = require('./utils'),
	compression = require('compression');

require('./website/config/passport')(passport);

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
				'script-src': ['\'unsafe-inline\'', 'https://kit.fontawesome.com', config.domain, 'https://cdn.jsdelivr.net'],
				'style-src': ['\'unsafe-inline\'', config.domain],
				'connect-src': ['\'unsafe-inline\'', 'https://ka-f.fontawesome.com/'],
				'font-src': ['\'unsafe-inline\'', 'https://ka-f.fontawesome.com'],
				'img-src': ['\'unsafe-inline\'', 'https://www.freeiconspng.com', config.domain, 'data:', 'https://www.tenforums.com'],
				'media-src': ['\'unsafe-inline\'', config.domain],
				'frame-src': ['\'unsafe-inline\'', config.domain, ...config.frame_domains],
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
	.use(fileUpload({
		// 50 MB file upload
		limits: { fileSize: 50 * 1024 * 1024 },
		useTempFiles: true,
		tempFileDir: '/tmp/',
	}))
	.use(bodyParser.urlencoded({ extended: true }))
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
	.use('/', require('./website/router'))
	.use('/files', require('./website/router/files'))
	.use('/user', require('./website/router/user'))
	.use('/auth', require('./website/router/auth'))
	.listen(config.port, () => logger.log(`Started on PORT: ${config.port}`, 'ready'));
