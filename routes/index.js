var router = require('koa-router')();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
var ds = require('../datasource');
var model = require('../models');
var CronJob = require('cron').CronJob;

/**------------------------------------------------------------- 
 * 定时任务，每隔一段时间将数据库中角色过期时间小于当前时间的内部用户的角色信息删除
 */
Date.prototype.format =function(format) {
  var o = {
  "M+" : this.getMonth()+1, //month
  "d+" : this.getDate(), //day
  "h+" : this.getHours(), //hour
  "m+" : this.getMinutes(), //minute
  "s+" : this.getSeconds(), //second
  "q+" : Math.floor((this.getMonth()+3)/3), //quarter
  "S" : this.getMilliseconds() //millisecond
  }
  if(/(y+)/.test(format)) {
    format=format.replace(RegExp.$1,(this.getFullYear()+"").substr(4- RegExp.$1.length));
  }
  for(var k in o){
    if(new RegExp("("+ k +")").test(format)) {
      format = format.replace(RegExp.$1,RegExp.$1.length==1? o[k] :("00"+ o[k]).substr((""+ o[k]).length));
    }
  }
  return format;
}
var job = new CronJob('00 */5 * * * *', async function() {
  //var current_time = new Date().toLocaleString();
  var current_time = new Date().format("yyyy-MM-dd hh:mm:ss");
  await ds.knex.raw(
    "delete from roles using users where roles.user_id=users.id and users.type='INTERNAL' and roles.expiring_date < ?;",
    current_time
  );
}, null, true, 'Asia/Chongqing');

/**-------------------------------------------------------------
 * 主页
 * 根据session是否为空，决定显示登陆页还是欢迎页
 */
router.get('/', async function (ctx, next) {
  if (ctx.session.user) {
    await ctx.render('index', {
      title: 'EVA管理平台',
      user: ctx.session.user
    });
  } else {
    return ctx.redirect('/login');
  }
});

/**-------------------------------------------------------------
 * 欢迎页
 * 将session中的用户名传递给欢迎页
 */
router.get('/default', async function (ctx, next) {
  await ctx.render('default', {
    title: 'EVA管理平台',
    user: ctx.session.user
  });
});
/** 因为管理员账号只需要1个，没有注册的必要了。
 *  今后如果有需求再将其打开
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
    await ctx.render('reg', {
      title: 'EVA管理平台-注册',
      error: '两次密码不一致'
    });
  } else {
    //判断用户名是否存在
    var count = await model.Managers.where('username', ctx.request.body['username']).count('username');
    if(count != 0) {
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
      ctx.session.user = newUser;
      await ctx.render('reg', {
        title: 'EVA管理平台-注册',
        success: '注册成功，可以直接登录'
      });
      return ctx.redirect('/login');
    }
  }
});
*/
// 登录页
router.get('/login', async function (ctx, next) {
  await ctx.render('login', {
    title: 'EVA管理平台-登录'
  });
});

// 提交登录信息
router.post('/login', async function (ctx, next) {
  /** 因为管理员账号只需要1个，没有数据库存取的必要了。
   *  今后如果有需求再将其打开
  //需要判断的逻辑：用户名不存在或者密码错误
  var count = await model.Managers.where('username', ctx.request.body['username']).count('username');
  if(count == 0) {
    await ctx.render('login', {
      title: 'EVA管理平台-登录',
      error: '用户名不存在'
    });
  } else {
    var hmac = crypto.createHmac('sha256', 'liuyueyi');
    var password = hmac.update(ctx.request.body['password']).digest('hex');
    var user = await model.Managers.where('username', ctx.request.body['username']).fetch();
    if (user.attributes.password == password) {
      ctx.session.user = user.attributes.username;
      return ctx.response.redirect('/'); 
    } else {
      await ctx.render('login', {
        title: 'EVA管理平台-登录',
        error: '密码错误'
      });
    }
  }
  */
  if (ctx.request.body['username'] != 'admin') { //用户名是admin
    await ctx.render('login', {
      title: 'EVA管理平台-登录',
      error: '用户名不存在'
    });
  } else {
    var hmac = crypto.createHmac('sha256', 'liuyueyi');
    var password = hmac.update(ctx.request.body['password']).digest('hex');
    if (password != '1d4936e73bd8273cf26e711646ca079b265e5852d3078d4465f0ac3436eefe4b') { //密码是pass
      await ctx.render('login', {
        title: 'EVA管理平台-登录',
        error: '密码错误'
      });
    } else {
      ctx.session.user = 'admin';
      return ctx.response.redirect('/'); 
    }
  }
});

// 登出请求
router.get('/logout', async function (ctx, next) {
  ctx.session.user = null;
  return ctx.redirect('/');
});

/**-------------------------------------------------------------
 * 用户管理页
 * 查询数据库，并把信息返回至客户端用于显示 
 */ 
router.get('/user_manage', async function (ctx, next) {
  var origin_results = await model.Users.query('orderBy', 'id', 'asc').fetchPage({
      page: 1,
      pageSize: 10
    });
  var page_num = origin_results.pagination['pageCount']; 
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
      "type":origin_results.models[i].attributes.type,
      "createdAt":origin_results.models[i].attributes.created_at.format('yyyy-MM-dd hh:mm:ss'),
      "updatedAt":origin_results.models[i].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss'),
    }
  }
  if (ctx.session.user) {
    await ctx.render('user_manage', {
      title: 'EVA管理平台-用户管理',
      results: {results,page_num}
    });
  } else {
    return ctx.redirect('/login');
  }
});


/**采用AJAX处理前端发回的请求
 * 用户管理页
 * 根据action值的不同完成对应的操作：
 * 0 - 对原始结果分页显示
 * 1 - 模糊搜索
 * 2 - 添加新用户
 * 3 - 删除用户
 * 4 - 修改基本信息
 * 5 - 对搜索结果的分页显示
 * 6 - 重置密码
 */
router.post('/user_manage',async function(ctx,next) { 
  if (ctx.request.body.action == 0) {
    var users = {};
    var content = ctx.request.body.content.page;
    var results = await model.Users.query('orderBy', 'id', 'asc').fetchPage({
      page: content,
      pageSize: 10
    });
    for(var len = 0;len < results.length;len++){
      users[len] = results.models[len].attributes;
      users[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      users[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {users};

  } else if (ctx.request.body.action == 1) {
    var users = {};
    var content = ctx.request.body.content;
    var content1 = '%'+content+'%'; 
    var results = await model.Users.query('orderBy', 'id', 'asc').query(function(qb) {
      qb.where('email','like',content1)
      .orWhere('name','like',content1)
      .orWhere('phone','like',content1)
      .orWhere('address','like',content1)
      .orWhere('site','like',content1)
      .orWhere('title','like',content1)
      .orWhere('state','like',content1)
      .orWhere('type','like',content1)
    }).fetchPage({
      page: 1,
      pageSize: 10
    });
    var page_num = results.pagination['pageCount']; 
    for(var len = 0;len < results.length;len++){
      users[len] = results.models[len].attributes;
      users[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      users[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {users,page_num};

  } else if (ctx.request.body.action == 2) {
    var content = ctx.request.body.content;
    var password = bcrypt.hashSync(ctx.request.body.content['password'],9);
    await model.Users.forge()
    .save({
      email: ctx.request.body.content['email'],
      password: password,
      name: ctx.request.body.content['name'],
      phone: ctx.request.body.content['phone'],
      address: ctx.request.body.content['address'],
      site: ctx.request.body.content['site'],
      title: ctx.request.body.content['title'],
      state: ctx.request.body.content['state'],
      type: ctx.request.body.content['type']
    })
    .then(function() {
      var ret = '添加成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '添加失败！';
      console.log(err)
      ctx.body = {ret};
    });
    

  } else if (ctx.request.body.action == 3) {
    var id = ctx.request.body.content;
    await model.Users.where('id','=',id).destroy()
    .then(function() {
      var ret = '删除成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '删除失败！';
      console.log(err)
      ctx.body = {ret};
    });

  } else if (ctx.request.body.action == 4) {
    var content = ctx.request.body.content;
    await model.Users.forge({id: ctx.request.body.content['id']})
    .save({
      email: ctx.request.body.content['email'],
      name: ctx.request.body.content['name'],
      phone: ctx.request.body.content['phone'],
      address: ctx.request.body.content['address'],
      site: ctx.request.body.content['site'],
      title: ctx.request.body.content['title'],
      state: ctx.request.body.content['state'],
      type: ctx.request.body.content['type']
    }, {patch: true})
    .then(function() {
      var ret = '修改成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '修改失败！';
      console.log(err)
      ctx.body = {ret};
    });

  } else if (ctx.request.body.action == 5) {
    var users = {};
    var content = ctx.request.body.content.search_content;
    var content1 = '%'+content+'%'; 
    var results = await model.Users.query('orderBy', 'id', 'asc').query(function(qb) {
      qb.where('email','like',content1)
      .orWhere('name','like',content1)
      .orWhere('phone','like',content1)
      .orWhere('address','like',content1)
      .orWhere('site','like',content1)
      .orWhere('title','like',content1)
      .orWhere('state','like',content1)
      .orWhere('type','like',content1)
    }).fetchPage({
      page: ctx.request.body.content.page,
      pageSize: 10
    });
    for(var len = 0;len < results.length;len++){
      users[len] = results.models[len].attributes;
      users[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      users[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {users};
    
  } else if (ctx.request.body.action == 6) {
    var content = ctx.request.body.content;
    var password = bcrypt.hashSync(ctx.request.body.content['password'],9);
    await model.Users.forge({id: ctx.request.body.content['id']})
    .save({
      password: password
    }, {patch: true})
    .then(function() {
      var ret = '修改密码成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '修改密码失败！';
      console.log(err)
      ctx.body = {ret};
    });
  }
});

/**-------------------------------------------------------------
 * 角色管理页
 * 查询数据库，并把信息返回至客户端用于显示 
 */
router.get('/role_manage', async function (ctx, next) {
  var results = {};
  var users = {};
  var studies = {};
  var origin_results = await model.Roles.forge().query('orderBy', 'id', 'asc').fetchPage({
      page: 1,
      pageSize: 10,
      withRelated:['user','study','site']
    });
  var page_num = origin_results.pagination['pageCount']; 
  for(var i = 0;i < origin_results.length;i++){
    results[i] = {
      "id":origin_results.models[i].attributes.id,
      "user_name":origin_results.models[i].relations.user.attributes.name,
      "study_name":origin_results.models[i].relations.study.attributes.name,
      "site_name":origin_results.models[i].relations.site.attributes.name,
      "type":origin_results.models[i].attributes.type,
      "state":origin_results.models[i].attributes.state,
      "expiring_date":origin_results.models[i].attributes.expiring_date,
      "createdAt":origin_results.models[i].attributes.created_at.format('yyyy-MM-dd hh:mm:ss'),
      "updatedAt":origin_results.models[i].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss')
    }
    if (origin_results.models[i].attributes.expiring_date != null) {
      results[i].expiring_date = origin_results.models[i].attributes.expiring_date.format('yyyy-MM-dd hh:mm:ss');
    }
  }
  var origin_users = await model.Users.query('orderBy', 'id', 'asc').fetchAll();
  for(var i = 0;i < origin_users.length;i++){
    users[i] = {
      "id": origin_users.models[i].attributes.id,
      "name": origin_users.models[i].attributes.name
    }
  }
  var origin_studies = await model.Studies.query('orderBy', 'id', 'asc').fetchAll();
  for(var i = 0;i < origin_studies.length;i++){
    studies[i] = {
      "id": origin_studies.models[i].attributes.id,
      "name": origin_studies.models[i].attributes.name
    }
  }
  if (ctx.session.user) {
    await ctx.render('role_manage', {
      title: 'EVA管理平台-角色管理',
      results: {results,users,studies,page_num}
    });
  } else {
    return ctx.redirect('/login');
  }
});

/**采用AJAX处理前端发回的请求
 * 角色管理页
 * 根据action值的不同完成对应的操作：
 * 0 - 分页显示 
 * 1 - 模糊搜索 
 * 2 - 添加角色信息
 * 3 - 删除角色信息
 * 4 - 修改
 * 5 - 对搜索结果的分页显示 
 * 7 - 根据项目id查询出参与该项目的所有机构信息
 */
router.post('/role_manage',async function(ctx,next) { 
  if (ctx.request.body.action == 0) { 
    var roles = {};
    var content = ctx.request.body.content.page;
    var results = await model.Roles.query(function(qb) {
      qb //使用leftJoin，即使有的行site.name为空值，也可以被搜索出来
      .select('roles.id','users.name as user_name','studies.name as study_name','sites.name as site_name','roles.type','roles.state','roles.expiring_date','roles.created_at','roles.updated_at')
      .leftJoin('users','roles.user_id','users.id')
      .leftJoin('studies','roles.study_id','studies.id')
      .leftJoin('sites','roles.site_id','sites.id')
    }).query('orderBy', 'roles.id', 'asc').fetchPage({
      page: content,
      pageSize: 10
    });
    for(var len = 0;len < results.length;len++) {
      roles[len] = results.models[len].attributes;
      if (results.models[len].attributes.expiring_date != null) {
        roles[len].expiring_date = results.models[len].attributes.expiring_date.format('yyyy-MM-dd hh:mm:ss');
      }
      roles[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      roles[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {roles};

  } else if (ctx.request.body.action == 1) {
    var roles = {};
    var content = ctx.request.body.content;
    var content1 = '%'+content+'%'; 
    var results = await model.Roles.query(function(qb) {
      qb //使用leftJoin，即使有的行site.name为空值，也可以被搜索出来
      .select('roles.id','users.name as user_name','studies.name as study_name','sites.name as site_name','roles.type','roles.state','roles.expiring_date','roles.created_at','roles.updated_at')
      .leftJoin('users','roles.user_id','users.id')
      .leftJoin('studies','roles.study_id','studies.id')
      .leftJoin('sites','roles.site_id','sites.id')
      .where('users.name','like',content1)
      .orWhere('sites.name','like',content1)
      .orWhere('studies.name','like',content1)
      .orWhere('roles.state','like',content1)
      .orWhere('roles.type','like',content1)
    }).query('orderBy', 'roles.id', 'asc').fetchPage({
      page: 1,
      pageSize: 10
    });
    var page_num = results.pagination['pageCount'];
    for(var len = 0;len < results.length;len++) {
      roles[len] = results.models[len].attributes;
      if (results.models[len].attributes.expiring_date != null) {
        roles[len].expiring_date = results.models[len].attributes.expiring_date.format('yyyy-MM-dd hh:mm:ss');
      }
      roles[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      roles[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {roles,page_num};

  } else if (ctx.request.body.action == 2) {
    var user_id = ctx.request.body.content['user'];
    var users = await model.Users.where('id','=',user_id).fetch();
    var type = users.attributes.type; //根据用户类型，采用不同的处理方式
    await model.Roles.forge()
    .save({
      user_id: ctx.request.body.content['user'],
      study_id: ctx.request.body.content['study'],
      site_id: ctx.request.body.content['site'],
      type: ctx.request.body.content['type'],
      state: ctx.request.body.content['state'],
      expiring_date: ctx.request.body.content['expiring_date']
    })
    .then(function() {
      if (type == 'EXTERNAL') { //外部用户直接返回添加成功
        var ret = '添加成功！';
        ctx.body = {ret};
      } else if (type == 'INTERNAL') { //内部用户，生成8位字符序列作为登陆口令
        var chars = "ABCDEFGHJKLMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
        var space = chars.length;
        var pwd = "";
        for (var i = 0; i < 8; i++) {
          pwd += chars.charAt(Math.floor(Math.random()*space));
        }
        var password = bcrypt.hashSync(pwd,9);
        new model.Users({id: user_id})
        .save({
          password: password
        }, {patch: true}); //修改内部用户的密码

        var ret = `添加成功！
        
        你的临时登录口令为:`+pwd+`
        
        请记住这个序列！`;
        ctx.body = {ret};
      }
    })
    .catch(function(err) {
      var ret = '添加失败！';
      console.log(err)
      ctx.body = {ret};
    })

  } else if (ctx.request.body.action == 3) {
    var id = ctx.request.body.content;
    await model.Roles.where('id','=',id).destroy()
    .then(function() {
      var ret = '删除成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '删除失败！';
      console.log(err)
      ctx.body = {ret};
    });

  } else if (ctx.request.body.action == 4) {
    var content = ctx.request.body.content;
    await model.Roles.forge({id: ctx.request.body.content['id']})
    .save({
      state: ctx.request.body.content['state'],
      expiring_date: ctx.request.body.content['expiring_date']
    }, {patch: true})
    .then(function() {
      var ret = '修改成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '修改失败！';
      console.log(err)
      ctx.body = {ret};
    });

  } else if (ctx.request.body.action == 5) {
    var roles = {};
    var content = ctx.request.body.content.search_content;
    var content1 = '%'+content+'%'; 
    var results = await model.Roles.query(function(qb) {
      qb //使用leftJoin，即使有的行site.name为空值，也可以被搜索出来
      .select('roles.id','users.name as user_name','studies.name as study_name','sites.name as site_name','roles.type','roles.state','roles.expiring_date','roles.created_at','roles.updated_at')
      .leftJoin('users','roles.user_id','users.id')
      .leftJoin('studies','roles.study_id','studies.id')
      .leftJoin('sites','roles.site_id','sites.id')
      .where('users.name','like',content1)
      .orWhere('sites.name','like',content1)
      .orWhere('studies.name','like',content1)
      .orWhere('roles.state','like',content1)
      .orWhere('roles.type','like',content1)
    }).query('orderBy', 'roles.id', 'asc').fetchPage({
      page: ctx.request.body.content.page,
      pageSize: 10
    });
    for(var len = 0;len < results.length;len++){
      roles[len] = results.models[len].attributes;
      if (results.models[len].attributes.expiring_date != null) {
        roles[len].expiring_date = results.models[len].attributes.expiring_date.format('yyyy-MM-dd hh:mm:ss');
      }
      roles[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      roles[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {roles};
    
  } else if (ctx.request.body.action == 7) {
    var sites = {};
    var id = ctx.request.body.content;
    var origin_results = await model.Study_Sites.where({study_id:id}).query('orderBy', 'id', 'asc').fetchAll({withRelated:['study','site']}); 
    for(var i = 0;i < origin_results.length;i++){
      sites[i] = {
        "id": origin_results.models[i].relations.site.attributes.id,
        "name": origin_results.models[i].relations.site.attributes.name
      }
    }
    ctx.body = {sites};
  }
});

/**-------------------------------------------------------------
 * 项目管理页
 * 查询数据库，并把信息返回至客户端用于显示 
 */
router.get('/study_manage', async function (ctx, next) {
  var origin_results = await model.Studies.query('orderBy', 'id', 'asc').fetchPage({
      page: 1,
      pageSize: 10
    });
  var page_num = origin_results.pagination['pageCount']; 
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
      "createdAt":origin_results.models[i].attributes.created_at.format('yyyy-MM-dd hh:mm:ss'),
      "updatedAt":origin_results.models[i].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss')
    }
    if (origin_results.models[i].attributes.due_date != null) {
      results[i].due_date = origin_results.models[i].attributes.due_date.format('yyyy-MM-dd hh:mm:ss');
    }
  }
  if (ctx.session.user) {
    await ctx.render('study_manage', {
      title: 'EVA管理平台-项目管理',
      results: {results,page_num}
    });
  } else {
    return ctx.redirect('/login');
  }
});

/**采用AJAX处理前端发回的请求
 * 项目管理页
 * 根据action值的不同完成对应的操作：
 * 0 - 分页显示
 * 1 - 模糊搜索
 * 2 - 添加新项目
 * 3 - 删除项目
 * 4 - 修改
 * 5 - 对搜索结果的分页显示 暂未实现
 */
router.post('/study_manage',async function(ctx,next) { 
  if (ctx.request.body.action == 0) {
    var studies = {};
    var content = ctx.request.body.content.page;
    var results = await model.Studies.query('orderBy', 'id', 'asc').fetchPage({
      page: content,
      pageSize: 10
    });
    for(var len = 0;len < results.length;len++){
      studies[len] = results.models[len].attributes;
      if (results.models[len].attributes.due_date != null) {
        studies[len].due_date = results.models[len].attributes.due_date.format('yyyy-MM-dd hh:mm:ss');
      }
      studies[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      studies[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {studies};

  } else if (ctx.request.body.action == 1) {
    var studies = {};
    var content = ctx.request.body.content;
    var content1 = '%'+content+'%'; 
    var results = await model.Studies.query('orderBy', 'id', 'asc').query(function(qb) {
      qb.where('uid','like',content1)
      .orWhere('name','like',content1)
      .orWhere('state','like',content1)
    }).fetchPage({
      page: 1,
      pageSize: 10
    });
    var page_num = results.pagination['pageCount']; 
    for(var len = 0;len < results.length;len++){
      studies[len] = results.models[len].attributes;
      if (results.models[len].attributes.due_date != null) {
        studies[len].due_date = results.models[len].attributes.due_date.format('yyyy-MM-dd hh:mm:ss');
      }
      studies[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      studies[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {studies,page_num};

  } else if (ctx.request.body.action == 2) {
    await model.Studies.forge()
    .save({
      uid: ctx.request.body.content['uid'],
      name: ctx.request.body.content['name'],
      state: ctx.request.body.content['state'],
      contract_number: ctx.request.body.content['contract_number'],
      type: ctx.request.body.content['type'],
      due_date:  ctx.request.body.content['due_date'],
      need_audit: ctx.request.body.content['need_audit']
    })
    .then(function() {
      var ret = '添加成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '添加失败！';
      console.log(err)
      ctx.body = {ret};
    });

  } else if (ctx.request.body.action == 3) {
    var id = ctx.request.body.content;
    await model.Studies.where('id','=',id).destroy()
    .then(function() {
      var ret = '删除成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '删除失败！';
      console.log(err)
      ctx.body = {ret};
    });

  } else if (ctx.request.body.action == 4) {
    var content = ctx.request.body.content;
    await model.Studies.forge({id: ctx.request.body.content['id']})
    .save({
      uid: ctx.request.body.content['uid'],
      name: ctx.request.body.content['name'],
      state: ctx.request.body.content['state'],
      contract_number: ctx.request.body.content['contract_number'],
      type: ctx.request.body.content['type'],
      due_date: ctx.request.body.content['due_date'],
      need_audit: ctx.request.body.content['need_audit']
    }, {patch: true})
    .then(function() {
      var ret = '修改成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '修改失败！';
      console.log(err)
      ctx.body = {ret};
    });

  } else if (ctx.request.body.action == 5) {
    var studies = {};
    var content = ctx.request.body.content.search_content;
    var content1 = '%'+content+'%'; 
    var results = await model.Studies.query('orderBy', 'id', 'asc').query(function(qb) {
      qb.where('uid','like',content1)
      .orWhere('name','like',content1)
      .orWhere('state','like',content1)
    }).fetchPage({
      page: ctx.request.body.content.page,
      pageSize: 10
    });
    for(var len = 0;len < results.length;len++){
      studies[len] = results.models[len].attributes;
      if (results.models[len].attributes.due_date != null) {
        studies[len].due_date = results.models[len].attributes.due_date.format('yyyy-MM-dd hh:mm:ss');
      }
      studies[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      studies[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {studies};
  }
});

/**-------------------------------------------------------------
 * 机构管理页
 * 查询数据库，并把信息返回至客户端用于显示 
 */ 
router.get('/site_manage', async function (ctx, next) {
  var origin_results = await model.Sites.query('orderBy', 'id', 'asc').fetchPage({
      page: 1,
      pageSize: 10
    });
  var page_num = origin_results.pagination['pageCount']; 
  var results = {};
  for(var i = 0;i < origin_results.length;i++){
    results[i] = {
      "id":origin_results.models[i].attributes.id,
      "name":origin_results.models[i].attributes.name,
      "type":origin_results.models[i].attributes.type,
      "address":origin_results.models[i].attributes.address,
      "code":origin_results.models[i].attributes.code,
      "createdAt":origin_results.models[i].attributes.created_at.format('yyyy-MM-dd hh:mm:ss'),
      "updatedAt":origin_results.models[i].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss'),
    }
  }
  if (ctx.session.user) {
    await ctx.render('site_manage', {
      title: 'EVA管理平台-机构管理',
      results: {results,page_num}
    });
  } else {
    return ctx.redirect('/login');
  }
});

/**采用AJAX处理前端发回的请求
 * 机构管理页
 * 根据action值的不同完成对应的操作：
 * 0 - 分页显示
 * 1 - 模糊搜索
 * 2 - 添加新机构
 * 3 - 删除机构
 * 4 - 修改
 * 5 - 对搜索结果的分页显示 暂未实现
 */
router.post('/site_manage',async function(ctx,next) { 
  if (ctx.request.body.action == 0) {
    var sites = {};
    var content = ctx.request.body.content.page;
    var results = await model.Sites.query('orderBy', 'id', 'asc').fetchPage({
      page: content,
      pageSize: 10
    });
    for(var len = 0;len < results.length;len++){
      sites[len] = results.models[len].attributes;
      sites[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      sites[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {sites};

  } else if (ctx.request.body.action == 1) {
    var sites = {};
    var content = ctx.request.body.content;
    var content1 = '%'+content+'%'; 
    var results = await model.Sites.query('orderBy', 'id', 'asc').query(function(qb) {
      qb.where('name','like',content1)
      .orWhere('type','like',content1)
      .orWhere('address','like',content1)
      .orWhere('code','like',content1)
    }).fetchPage({
      page: 1,
      pageSize: 10
    });
    var page_num = results.pagination['pageCount']; 
    for(var len = 0;len < results.length;len++){
      sites[len] = results.models[len].attributes;
      sites[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      sites[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {sites,page_num};

  } else if (ctx.request.body.action == 2) {
    await model.Sites.forge()
    .save({
      name: ctx.request.body.content['name'],
      type: ctx.request.body.content['type'],
      address: ctx.request.body.content['address'],
      code: ctx.request.body.content['code']
    })
    .then(function() {
      var ret = '添加成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '添加失败！';
      console.log(err)
      ctx.body = {ret};
    });

  } else if (ctx.request.body.action == 3) {
    var id = ctx.request.body.content;
    await model.Sites.where('id','=',id).destroy()
    .then(function() {
      var ret = '删除成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '删除失败！';
      console.log(err)
      ctx.body = {ret};
    });

  } else if (ctx.request.body.action == 4) {
    var content = ctx.request.body.content;
    await model.Sites.forge({id: ctx.request.body.content['id']})
    .save({
      name: ctx.request.body.content['name'],
      type: ctx.request.body.content['type'],
      address: ctx.request.body.content['address'],
      code: ctx.request.body.content['code']
    }, {patch: true})
    .then(function() {
      var ret = '修改成功！';
      ctx.body = {ret};
    })
    .catch(function(err) {
      var ret = '修改失败！';
      console.log(err)
      ctx.body = {ret};
    });

  } else if (ctx.request.body.action == 5) {
    var sites = {};
    var content = ctx.request.body.content.search_content;
    var content1 = '%'+content+'%'; 
    var results = await model.Sites.query('orderBy', 'id', 'asc').query(function(qb) {
      qb.where('name','like',content1)
      .orWhere('type','like',content1)
      .orWhere('address','like',content1)
      .orWhere('code','like',content1)
    }).fetchPage({
      page: ctx.request.body.content.page,
      pageSize: 10
    });
    for(var len = 0;len < results.length;len++){
      sites[len] = results.models[len].attributes;
      sites[len].created_at = results.models[len].attributes.created_at.format('yyyy-MM-dd hh:mm:ss');
      sites[len].updated_at = results.models[len].attributes.updated_at.format('yyyy-MM-dd hh:mm:ss');
    }
    ctx.body = {sites};
  }
});

/**-------------------------------------------------------------
 * 日志管理页
 */ 
router.get('/log_manage', async function (ctx, next) {
  if (ctx.session.user) {
    await ctx.render('log_manage', {
      title: 'EVA管理平台-日志管理'
    });
  } else {
    return ctx.redirect('/login');
  }
});

/**-------------------------------------------------------------
 * 使用帮助页
 */ 
router.get('/help', async function (ctx, next) {
  if (ctx.session.user) {
    await ctx.render('help', {
      title: 'EVA管理平台-使用帮助'
    });
  } else {
    return ctx.redirect('/login');
  }
});

/**-------------------------------------------------------------
 * 相关设置页
 */ 
router.get('/settings', async function (ctx, next) {
  if (ctx.session.user) {
    await ctx.render('settings', {
    title: 'EVA管理平台-相关设置'
  });
  } else {
    return ctx.redirect('/login');
  }
});

module.exports = router;
