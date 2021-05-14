"use strict"; // https://www.w3schools.com/js/js_strict.asp

// pkg
const express = require("express"),
      cors = require('cors'),
      app = express(),
      ms = require("ms"),
      fs = require("fs"),
      port = Number(1111),
      helmet = require("helmet"),
      compression = require('compression');

let corsOpt = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version'],
  optionsSuccessStatus: 204
};

let locale = __dirname + "/files", // file that will be served into public.
    assets = __dirname + "/assets"; // normal assets such as index.html or else.

// normal configuration
app.disable('x-powered-by');
app.use(helmet());

// cors
app.use(cors(corsOpt));

// compress the file, always compress it, no matter what
app.use(compression());

// i dont think this thing should be cached.
app.use(express.static(assets));

// caching
app.use(express.static(locale, {maxAge: ms("24h")}));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  next();
});

// usually return favicon.ico, use "res.status(204).end()" if you want to.
app.get('/favicon.ico', (req, res) => res.status(200).sendFile(assets + "/favicon.ico"));

// dont let any robots crawl this thing
app.get('/robots.txt', (req, res) => res.sendFile(assets + "/robots.txt"));

// example: https://cdn.blob-project.com/
app.get("/", (req, res) => res.status(200).send("ok"));

// some sort of error handling
app.use("/files", (req, res, next) => {
  if (fs.existsSync(locale + req.url)) { // if the file exists, skip.
    next();
  } else { // return if its not found.
    res.status(404).send("unknown resource.");
    next();
  };
});

// example: https://cdn.blob-project.com/files/to/your/things
app.get("/files", (req, res, next) => {
  res.sendFile(locale + req.url, (err) => { // send files
    if (err) {
      res.status(404).send("unknown resource.");
      next();
    } else {
      next();
    }
  })
});

// ready to be served.
app.listen(port, () => console.log(`Started on PORT: ${port}`)); // PORT = 1111 (default, you can change it)
