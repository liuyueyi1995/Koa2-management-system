var router = require('koa-router')();
const crypto = require('crypto');
var ds = require('../datasource')
var model = require('../models')

/**------------------------------------------------------------- */
// 主页
router.get('/', async function (ctx, next) {
  await ctx.render('index', {
    title: 'EVA管理平台',
    user: ctx.session.user
  });
});
// 默认的欢迎页
router.get('/default', async function (ctx, next) {
  await ctx.render('default', {
    title: 'EVA管理平台',
    user: ctx.session.user
  });
});
// 注册页
router.get('/reg', async function (ctx, next) {
  await ctx.render('reg', {
    title: 'EVA管理平台-注册'
  });
});
// 提交注册信息
router.post('/reg', async function (ctx, next) {
  if(ctx.request.body['username'].length > 25) {
    //判断用户名是否过长，数据库设置username字段为varchar(25)
    await ctx.render('reg', {
      title: 'EVA管理平台-注册',
      error: '用户名不得超过25个字符'
    });
  } else if(ctx.request.body['password2'] !== ctx.request.body['password']) {
    //判断两次密码是否一致
    console.log('两次密码不一致');
    await ctx.render('reg', {
      title: 'EVA管理平台-注册',
      error: '两次密码不一致'
    });
  } else {
    //判断用户名是否存在
    var count = await model.Managers.where('username', ctx.request.body['username']).count('username');
    if(count != 0) {
      console.log('用户名已存在！');
      await ctx.render('reg', {
        title: 'EVA管理平台-注册',
        error: '用户名已存在'
      });
    } else {
      var hmac = crypto.createHmac('sha256', 'liuyueyi');
      var password = hmac.update(ctx.request.body['password']).digest('hex');
      var newUser = new model.Managers({
        username: ctx.request.body['username'],
        password: password
      });
      await newUser.save();
      console.log('注册成功，可以直接登录！');
      ctx.session.user = newUser;
      await ctx.render('reg', {
        title: 'EVA管理平台-注册',
        success: '注册成功，可以直接登录'
      });
      return ctx.redirect('/login');
    }
  }
});
// 登录页
router.get('/login', async function (ctx, next) {
  await ctx.render('login', {
    title: 'EVA管理平台-登录'
  });
});
// 提交登录信息
router.post('/login', async function (ctx, next) {
  //需要判断的逻辑：用户名不存在或者密码错误
  var count = await model.Managers.where('username', ctx.request.body['username']).count('username');
  if(count == 0) {
    console.log('用户名不存在！');
    await ctx.render('login', {
      title: 'EVA管理平台-登录',
      error: '用户名不存在'
    });
  } else {
    var hmac = crypto.createHmac('sha256', 'liuyueyi');
    var password = hmac.update(ctx.request.body['password']).digest('hex');
    var user = await model.Managers.where('username', ctx.request.body['username']).fetch();
    if (user.attributes.password == password) {
      console.log('登陆成功！'+ user.attributes.username);
      ctx.session.user = user.attributes.username;
      //console.log(currentUser);
      return ctx.response.redirect('/');
    } else {
      console.log('密码错误！');
      //return ctx.response.redirect('/login');
      await ctx.render('login', {
        title: 'EVA管理平台-登录',
        error: '密码错误'
      });
    }
  }
});
// 登出请求
router.get('/logout', async function (ctx, next) {
  ctx.session.user = null;
  return ctx.redirect('/');
});


/**------------------------------------------------------------- */
// 应用角色管理页
router.get('/user_app', async function (ctx, next) {
  //var appRole = await model.AppRoles.fetchAll(); //获取所有应用角色的列表
  var results = await model.Users.forge().fetchAll({withRelated:['approle','dbrole']});
  
  var relations = {};
  for(var i = 0;i < results.length;i++){
    relations[i] = {
      'id': i + 1,
      'username':results.models[i].attributes.username,
      'approle':results.models[i].relations.approle.attributes.rolename
    };
  }
  console.log(relations);
  await ctx.render('user_app', {
    title: 'EVA管理平台-应用角色管理',
    relations: relations
  });
});

// 数据库角色管理页
router.get('/user_db', async function (ctx, next) {
  var results = await model.Users.forge().fetchAll({withRelated:['approle','dbrole']});
  
  var relations = {};
  for(var i = 0;i < results.length;i++){
    relations[i] = {
      'id': i + 1,
      'username':results.models[i].attributes.username,
      'dbrole':results.models[i].relations.dbrole.attributes.rolename
    };
  }
  console.log(relations);
  await ctx.render('user_db', {
    title: 'EVA管理平台-数据库角色管理',
    relations: relations
  });
});


/**------------------------------------------------------------- */
// WAF日志查看
router.get('/waf_log', async function (ctx, next) {
  var wafLogs = await model.WafLogs.fetchAll();//从数据库中查询所有的日志信息
  var logs = {};
  for(var i = 0;i < wafLogs.length;i++){
    logs[i] = wafLogs.models[i].attributes;
  }
  await ctx.render('waf_log', {
    title: 'EVA管理平台-waf日志',
    logs: logs
  });
});

// 采用AJAX处理对waf_log表的搜索
router.post('/waf_log',async function(ctx,next) {
  var logs = {};
  var len = 0;
  var content = ctx.request.body.content;
  var content1 = '%'+content+'%'; 
  if (typeof(content) == Number) {
    var result1 = await model.WafLogs.where('id','=',content).fetchAll(); 
    for(;len < result1.length;len++){
      logs[len] = result1.models[len].attributes;
    }
  }
  var result2 = await model.WafLogs.where('time','like',content1).fetchAll(); 
  var result3 = await model.WafLogs.where('username','like',content1).fetchAll(); 
  var result4 = await model.WafLogs.where('function','like',content1).fetchAll(); 
  var result5 = await model.WafLogs.where('url','like',content1).fetchAll(); 
  var result6 = await model.WafLogs.where('param','like',content1).fetchAll(); 
  var result7 = await model.WafLogs.where('result','like',content1).fetchAll(); 
  
  for(;len < result2.length;len++){
    logs[len] = result2.models[len].attributes;
  }
  for(;len < result3.length;len++){
    logs[len] = result3.models[len].attributes;
  }
  for(;len < result4.length;len++){
    logs[len] = result4.models[len].attributes;
  }
  for(;len < result5.length;len++){
    logs[len] = result5.models[len].attributes;
  }
  for(;len < result6.length;len++){
    logs[len] = result6.models[len].attributes;
  }
  for(;len < result7.length;len++){
    logs[len] = result7.models[len].attributes;
  }
  ctx.body = {logs,len};
});


module.exports = router;
