var router = require('koa-router')();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
var ds = require('../datasource');
var model = require('../models');

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



/**
 * 用户管理页
 * 查询数据库，并把信息返回至客户端用于显示 
 */ 
router.get('/user_manage', async function (ctx, next) {
  var origin_results = await model.Users.fetchAll();
  var results = {};
  for(var i = 0;i < origin_results.length;i++){
    results[i] = {
      "id":origin_results.models[i].attributes.id,
      "email":origin_results.models[i].attributes.email,
      "name":origin_results.models[i].attributes.name,
      "phone":origin_results.models[i].attributes.phone,
      "address":origin_results.models[i].attributes.address,
      "site":origin_results.models[i].attributes.site,
      "title":origin_results.models[i].attributes.title,
      "state":origin_results.models[i].attributes.state,
      "createdAt":origin_results.models[i].attributes.created_at,
      "updatedAt":origin_results.models[i].attributes.updated_at,
    }
  }
  await ctx.render('user_manage', {
    title: 'EVA管理平台-用户管理',
    results: results
  });
});


/**采用AJAX处理对前端发回的请求
 * 用户管理页
 * 根据action值的不同完成对应的操作：
 * 1 - 模糊搜索
 * 2 - 添加新用户
 * 3 - 删除用户
 * 4 - 修改基本信息
 * 5 - 重置密码
 */
router.post('/user_manage',async function(ctx,next) { 
  if (ctx.request.body.action == 1) {
    var users = {};
    var len = 0;
    var content = ctx.request.body.content;
    var content1 = '%'+content+'%'; 
    var results = await model.Users.query(function(qb) {
      qb.where('email','like',content1)
      .orWhere('name','like',content1)
      .orWhere('phone','like',content1)
      .orWhere('address','like',content1)
      .orWhere('site','like',content1)
      .orWhere('title','like',content1)
      .orWhere('state','like',content1)
    }).fetchAll();
    for(;len < results.length;len++){
      users[len] = results.models[len].attributes;
    }
    ctx.body = {users,len};

  } else if (ctx.request.body.action == 2) {
    var content = ctx.request.body.content;
    var password = bcrypt.hashSync(ctx.request.body.content['password'],9);
    var newUser = new model.Users({
      email: ctx.request.body.content['email'],
      password: password,
      name: ctx.request.body.content['name'],
      phone: ctx.request.body.content['phone'],
      address: ctx.request.body.content['address'],
      site: ctx.request.body.content['site'],
      title: ctx.request.body.content['title'],
      state: ctx.request.body.content['state']
    });
    newUser.save();
    let ret = '添加成功！';
    ctx.body = {ret};

  } else if (ctx.request.body.action == 3) {
    var id = ctx.request.body.content;
    var result = await model.Users.where('id','=',id).destroy(); 
    let ret = '删除成功！';
    ctx.body = {ret};

  } else if (ctx.request.body.action == 4) {
    var content = ctx.request.body.content;
    new model.Users({id: ctx.request.body.content['id']})
    .save({
      email: ctx.request.body.content['email'],
      name: ctx.request.body.content['name'],
      phone: ctx.request.body.content['phone'],
      address: ctx.request.body.content['address'],
      site: ctx.request.body.content['site'],
      title: ctx.request.body.content['title'],
      state: ctx.request.body.content['state']
    }, {patch: true});
    let ret = '修改成功！';
    ctx.body = {ret};

  } else if (ctx.request.body.action == 5) {
    var content = ctx.request.body.content;
    var password = bcrypt.hashSync(ctx.request.body.content['password'],9);
    new model.Users({id: ctx.request.body.content['id']})
    .save({
      password: password
    }, {patch: true});
    let ret = '修改密码成功！';
    ctx.body = {ret};
  }
});



router.get('/role_manage', async function (ctx, next) {
  await ctx.render('role_manage', {
    title: 'EVA管理平台-数据导入'
  });
});

/**
 * 项目管理页
 * 查询数据库，并把信息返回至客户端用于显示 
 */
router.get('/study_manage', async function (ctx, next) {
  var origin_results = await model.Studies.fetchAll();
  var results = {};
  for(var i = 0;i < origin_results.length;i++){
    results[i] = {
      "id":origin_results.models[i].attributes.id,
      "uid":origin_results.models[i].attributes.uid,
      "name":origin_results.models[i].attributes.name,
      "state":origin_results.models[i].attributes.state,
      "contract_number":origin_results.models[i].attributes.contract_number,
      "type":origin_results.models[i].attributes.type,
      "due_date":origin_results.models[i].attributes.due_date,
      "need_audit":origin_results.models[i].attributes.need_audit,
      "createdAt":origin_results.models[i].attributes.created_at,
      "updatedAt":origin_results.models[i].attributes.updated_at
    }
  }
  console.log(results);
  await ctx.render('study_manage', {
    title: 'EVA管理平台-项目管理',
    results: results
  });
});

/**采用AJAX处理对前端发回的请求
 * 项目管理页
 * 根据action值的不同完成对应的操作：
 * 1 - 模糊搜索
 * 2 - 添加新项目
 * 3 - 删除项目
 * 4 - 修改
 */
router.post('/study_manage',async function(ctx,next) { 
  if (ctx.request.body.action == 1) {
    var studies = {};
    var len = 0;
    var content = ctx.request.body.content;
    var content1 = '%'+content+'%'; 
    var results = await model.Studies.query(function(qb) {
      qb.where('uid','like',content1)
      .orWhere('name','like',content1)
      .orWhere('state','like',content1)
    }).fetchAll();
    for(;len < results.length;len++){
      studies[len] = results.models[len].attributes;
    }
    ctx.body = {studies,len};

  } else if (ctx.request.body.action == 2) {
    var newStudy = new model.Studies({
      uid: ctx.request.body.content['uid'],
      name: ctx.request.body.content['name'],
      state: ctx.request.body.content['state'],
      contract_number: ctx.request.body.content['contract_number'],
      type: ctx.request.body.content['type'],
      due_date: null,
      need_audit: ctx.request.body.content['need_audit']
    });
    newStudy.save();
    let ret = '添加成功！';
    ctx.body = {ret};

  } else if (ctx.request.body.action == 3) {
    var id = ctx.request.body.content;
    var result = await model.Studies.where('id','=',id).destroy(); 
    let ret = '删除成功！';
    ctx.body = {ret};

  } else if (ctx.request.body.action == 4) {
    var content = ctx.request.body.content;
    new model.Studies({id: ctx.request.body.content['id']})
    .save({
      uid: ctx.request.body.content['uid'],
      name: ctx.request.body.content['name'],
      state: ctx.request.body.content['state'],
      contract_number: ctx.request.body.content['contract_number'],
      type: ctx.request.body.content['type'],
      due_date: null,
      need_audit: ctx.request.body.content['need_audit']
    }, {patch: true});
    let ret = '修改成功！';
    ctx.body = {ret};

  }
});

/**
 * 机构管理页
 * 查询数据库，并把信息返回至客户端用于显示 
 */ 
router.get('/site_manage', async function (ctx, next) {
  var origin_results = await model.Sites.fetchAll();
  var results = {};
  for(var i = 0;i < origin_results.length;i++){
    results[i] = {
      "id":origin_results.models[i].attributes.id,
      "name":origin_results.models[i].attributes.name,
      "type":origin_results.models[i].attributes.type,
      "address":origin_results.models[i].attributes.address,
      "code":origin_results.models[i].attributes.code,
      "createdAt":origin_results.models[i].attributes.created_at,
      "updatedAt":origin_results.models[i].attributes.updated_at,
    }
  }
  await ctx.render('site_manage', {
    title: 'EVA管理平台-机构管理',
    results: results
  });
});

/**采用AJAX处理对前端发回的请求
 * 机构管理页
 * 根据action值的不同完成对应的操作：
 * 1 - 模糊搜索
 * 2 - 添加新机构
 * 3 - 删除机构
 * 4 - 修改
 */
router.post('/site_manage',async function(ctx,next) { 
  if (ctx.request.body.action == 1) {
    var sites = {};
    var len = 0;
    var content = ctx.request.body.content;
    var content1 = '%'+content+'%'; 
    var results = await model.Sites.query(function(qb) {
      qb.where('name','like',content1)
      .orWhere('type','like',content1)
      .orWhere('address','like',content1)
      .orWhere('code','like',content1)
    }).fetchAll();
    for(;len < results.length;len++){
      sites[len] = results.models[len].attributes;
    }
    ctx.body = {sites,len};

  } else if (ctx.request.body.action == 2) {
    var newSite = new model.Sites({
      name: ctx.request.body.content['name'],
      type: ctx.request.body.content['type'],
      address: ctx.request.body.content['address'],
      code: ctx.request.body.content['code']
    });
    newSite.save();
    let ret = '添加成功！';
    ctx.body = {ret};

  } else if (ctx.request.body.action == 3) {
    var id = ctx.request.body.content;
    var result = await model.Sites.where('id','=',id).destroy(); 
    let ret = '删除成功！';
    ctx.body = {ret};

  } else if (ctx.request.body.action == 4) {
    var content = ctx.request.body.content;
    new model.Sites({id: ctx.request.body.content['id']})
    .save({
      name: ctx.request.body.content['name'],
      type: ctx.request.body.content['type'],
      address: ctx.request.body.content['address'],
      code: ctx.request.body.content['code']
    }, {patch: true});
    let ret = '修改成功！';
    ctx.body = {ret};

  }
});


/**------------------------------------------------------------- */
// 日志管理
router.get('/log_manage', async function (ctx, next) {
  var origin_logs = await model.Logs.fetchAll();//从数据库中查询所有的日志信息
  var logs = {};
  for(var i = 0;i < origin_logs.length;i++){
    logs[i] = origin_logs.models[i].attributes;
  }
  await ctx.render('log_manage', {
    title: 'EVA管理平台-日志管理',
    logs: logs
  });
});

// 采用AJAX处理对logs表的搜索
router.post('/log_manage',async function(ctx,next) {
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

router.get('/import', async function (ctx, next) {
  await ctx.render('import', {
    title: 'EVA管理平台-数据导入'
  });
});

router.get('/settings', async function (ctx, next) {
  await ctx.render('settings', {
    title: 'EVA管理平台-相关设置'
  });
});

module.exports = router;
