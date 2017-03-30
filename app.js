const Koa = require('koa');
const router = require('./routes/index');
const koaBody = require('koa-body');
const views = require('koa-views');
const convert = require('koa-convert');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser')();
const logger = require('koa-logger');
const session = require('koa-session-store');
const mongoStore = require('koa-session-mongo');
const co = require('co');
const Promise = require('bluebird');
const Raven = require('raven');

const app = new Koa();
Raven.config('http://16843242dab34d0982fb8ead11779100:629aa8ee3dc747bc8b150361664c09bb@192.168.100.119:9000/8').install();

// middlewares
app.use(convert(bodyparser));
app.use(convert(json()));
app.use(convert(logger()));
app.use(convert(require('koa-static')(__dirname + '/public',{maxage:3600000})));
app.keys = ['liuyueyi'];
app.use(convert(session({
  store: mongoStore.create({
    db: 'oa-session'
  })
})));

// views
app.use(views(__dirname + '/views', {
  extension: 'pug'
}));

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// routes
app.use(router.routes());

// error
app.on('error', function(err){
  //console.log(err)
  //log.error('server error', err, ctx);
  
  Raven.captureException(err);
});


module.exports = app;