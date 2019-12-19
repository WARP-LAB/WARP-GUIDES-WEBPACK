'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const http2 = require('http2');

const appProps = require(path.resolve(__dirname, 'properties.json'));

const mime = require('mime-types'); // no need to install, as tutorial deps already have it
const express = require('express'); // no need to install, as tutorial deps already have it
const yargs = require('yargs'); // no need to install, as tutorial deps already have it

const USE_HTTP2_TLS = true;

const argv = yargs
  .usage('$0 --tier tiername')
  .option('tier', {
    alias: 't',
    describe: 'provide tier name',
    type: 'string'
  })
  .demandOption(['tier'], 'Please provide tier name argument to run server\nUsually one of the following - development, testing, staging, production.')
  .help()
  .argv;

console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');

if (!appProps.tiers[argv.tier]) {
  console.log('\x1b[41m%s\x1b[0m', `No tier named ${argv.tier} was found in properties.json, aborting.`);
  process.exit(0);
}
console.log('\x1b[36m%s\x1b[0m', `Using tier named ${argv.tier}`);

const currTierProps = appProps.tiers[argv.tier];

console.log('\x1b[44m%s\x1b[0m', 'Picked up props from properties.json:');
console.log(currTierProps);

let propsValid = true;

if (!(currTierProps.fqdn === 'localhost' || currTierProps.fqdn === '127.0.0.1')) {
  console.log('\x1b[41m%s\x1b[0m', 'fqdn is not \'localhost\' or \'127.0.0.1\'.');
  propsValid = false;
}

if (currTierProps.appPathUrlAboveServerRoot !== '') {
  console.log('\x1b[41m%s\x1b[0m', 'appPathUrlAboveServerRoot is not empty.');
  propsValid = false;
}

if (!propsValid) {
  console.log('\x1b[41m%s\x1b[0m', 'Aborting');
  process.exit(0); // exit gracefully
}

console.log('\x1b[36m%s\x1b[0m', `Will set up server to run at http${currTierProps.tls ? 's' : ''}://${currTierProps.fqdn}:${currTierProps.port}/`);
console.log('\x1b[36m%s\x1b[0m', 'It is your responsibility that app for tier chosen was built correctly!');

console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');

const httpsOptions = {
  ca: fs.readFileSync(path.resolve(require('os').homedir(), '.localhost-dev-certs/CA/WARPLocalhostCASelfSigned.pem')),
  key: fs.readFileSync(path.resolve(require('os').homedir(), `.localhost-dev-certs/Certificates/${currTierProps.fqdn}.key`)),
  cert: fs.readFileSync(path.resolve(require('os').homedir(), `.localhost-dev-certs/Certificates/${currTierProps.fqdn}.crt`)),
  allowHTTP1: true
};

if (USE_HTTP2_TLS && currTierProps.tls) {
  const {
    HTTP2_HEADER_PATH,
    // HTTP2_HEADER_METHOD,
    HTTP_STATUS_NOT_FOUND,
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  } = http2.constants;

  const server = http2.createSecureServer(httpsOptions);

  const serverRoot = path.resolve(__dirname, 'public/');

  const respondToStreamError = (err, stream) => {
    console.log(err);
    if (err.code === 'ENOENT') {
      stream.respond({':status': HTTP_STATUS_NOT_FOUND});
    }
    else {
      stream.respond({':status': HTTP_STATUS_INTERNAL_SERVER_ERROR});
    }
    stream.end();
  };

  server.on('stream', (stream, headers) => {
    // const reqMethod = headers[HTTP2_HEADER_METHOD];

    const reqPathOriginal = headers[HTTP2_HEADER_PATH];
    const reqPathCleaned = reqPathOriginal ? reqPathOriginal.split('?')[0] : '';

    const fsPathOriginal = path.join(serverRoot, reqPathOriginal);
    const fsPathCleaned = fsPathOriginal ? fsPathOriginal.split('?')[0] : '';

    const responseMimeType = mime.lookup(fsPathCleaned);

    if (reqPathCleaned === '/' || reqPathCleaned === '') {
      stream.respondWithFile(path.join(serverRoot, 'index.html'), {
        'content-type': 'text/html',
        ':status': 200
      }, {
        onError: (err) => {
          respondToStreamError(err, stream);
        }
      });
    }
    else if (reqPathCleaned === '/robots.txt') {
      stream.respond({
        'content-type': 'text/plain',
        ':status': 200
      });
      stream.end('User-agent: *\nAllow: /');
    }
    else {
      stream.respondWithFile(fsPathCleaned, {
        'content-type': responseMimeType,
        ':status': 200
      }, {
        onError: (err) => respondToStreamError(err, stream)
      });
    }
  });

  server.listen(currTierProps.port);
  console.log('\x1b[45m%s\x1b[0m\n', `Simple server started HTTP/2. https://${currTierProps.fqdn}:${currTierProps.port}/`);
}
else {
  const app = express();

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // this is kind of useless, as we are serving at custom ports (non 80 or 443) and only one server at the time
  app.use(function (req, res, next) {
    if (currTierProps.tls && !req.secure) {
      res.redirect('https://' + req.headers.host + req.url);
    }
    else {
      next();
    }
  });

  app.get('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send('User-agent: *\nAllow: /');
  });

  // app.get('/favicon.ico', function (req, res) {
  //   res.type('image/x-icon');
  //   res.end();
  // });

  // app.use('/assets', express.static(path.join(__dirname, 'public/assets/')));
  // app.use('/', express.static(path.join(__dirname, 'public/')));

  app.get('/assets/:assetId', function (req, res) {
    const cleanedAssetId = req.params.assetId ? req.params.assetId.split('?')[0] : '';
    const pathCheck = path.resolve(__dirname, 'public/assets/', cleanedAssetId);
    if (fs.existsSync(pathCheck)) {
      res.sendFile(pathCheck);
    }
    else {
      res.sendFile(path.resolve(__dirname, 'public/index.html'));
    }
  });

  app.get('/:assetId', function (req, res) {
    const cleanedAssetId = req.params.assetId ? req.params.assetId.split('?')[0] : '';
    const pathCheck = path.resolve(__dirname, 'public/', cleanedAssetId);
    if (fs.existsSync(pathCheck)) {
      res.sendFile(pathCheck);
    }
    else if (cleanedAssetId === '' || cleanedAssetId === '/') {
      res.sendFile(path.resolve(__dirname, 'public/index.html'));
    }
    else {
      console.log('Caught, will pass to 404', cleanedAssetId);
      res.status(404).send('404');
    }
  });

  app.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname, 'public/index.html'));
  });

  app.get('*', function (req, res) {
    console.log('Uncaught, will pass to 404', req.params);
    res.status(404).send('404');
    // res.sendFile(path.resolve(__dirname, 'public/index.html'));
  });

  if (currTierProps.tls) {
    https.createServer(httpsOptions, app).listen(currTierProps.port);
    console.log('\x1b[45m%s\x1b[0m\n', `Simple server started HTTP/1.1 with TLS. https://${currTierProps.fqdn}:${currTierProps.port}/`);
  }
  else {
    // app.listen(port);
    http.createServer(app).listen(currTierProps.port);
    console.log('\x1b[45m%s\x1b[0m\n', `Simple server started HTTP/1.1. http://${currTierProps.fqdn}:${currTierProps.port}/`);
  }
}
