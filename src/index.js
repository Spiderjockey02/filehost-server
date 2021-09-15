// pkg
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
	bodyParser = require('body-parser'),
	compression = require('compression');

require('./config/passport')(passport);

const corsOpt = {
	origin: '*',
	credentials: true,
	methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version'],
	optionsSuccessStatus: 204,
};
mongoose.connect(config.MongoDBURl, { useNewUrlParser: true, useUnifiedTopology : true })
	.then(() => {
		console.log('Connected to database');
	});
// normal configuration
app
	.use(helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ['\'self\''],
				'script-src': ['\'unsafe-inline\'', 'https://kit.fontawesome.com', 'https://maxcdn.bootstrapcdn.com', 'https://cdnjs.cloudflare.com', 'https://code.jquery.com', 'https://cdn.jsdelivr.net', 'https://unpkg.com/'],
				'style-src': ['\'unsafe-inline\'', 'https://maxcdn.bootstrapcdn.com', 'https://cdn.jsdelivr.net'],
				'connect-src': ['\'unsafe-inline\'', 'https://ka-f.fontawesome.com/', 'https://cdn.jsdelivr.net'],
				'font-src': ['\'unsafe-inline\'', 'https://ka-f.fontawesome.com'],
				'img-src': ['\'unsafe-inline\'', 'https://www.freeiconspng.com', config.domain, 'data:', 'https://www.tenforums.com'],
				'media-src': ['\'unsafe-inline\'', 'data:'],
			},
		},
	}))
	.use(cors(corsOpt))
	.use(compression())
	.use(fileUpload({
		// 100 MB file upload
		debug: true,
		limits: {
			fileSize: 50 * 1024 * 1024,
		},
		useTempFiles : true,
		tempFileDir : '/tmp/',
		abortOnLimit: true,
	}))
	.use(bodyParser.urlencoded({
		extended: true,
	}))
	.use(session({
		secret : 'secret',
		resave : true,
		saveUninitialized : true,
	}))
	.use(passport.initialize())
	.use(passport.session())
	.use(function(req, res, next) {
		if (req.originalUrl !== '/favicon.ico') {
			require('./utils/logger').log(req, res);
		}
		next();
	})
	.engine('html', require('ejs').renderFile)
	.set('view engine', 'ejs')
	.set('views', './src/views')
	.use(favicon('./src/assets/favicon.ico'))
	.use('/', require('./router'))
	.use('/files', require('./router/files'))
	.use('/users', require('./router/users'))
	.use('/auth', require('./router/auth'))
	.listen(config.port, () => console.log(`Started on PORT: ${config.port}`));
