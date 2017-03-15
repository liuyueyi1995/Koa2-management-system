# management_system 
## 简介
这是一个基于`koa2`的后台管理系统 

使用 `PostgreSql` 存储业务数据   
使用 `mongodb` 存储`session`   
使用 `bookshelf` + `knex` 作为ORM和Query Builder  
使用 `Sentry` 作为错误信息的收集反馈平台   
采用 `AJAX` 处理前端请求     

目录结构和babel的配置参考了 https://github.com/17koa/koa-demo   
原链接似乎已经被删掉了，这个是我fork过来的版本 https://github.com/liuyueyi1995/koa2-demo    
网站的前端代码来源于我之前的一个项目  https://github.com/liuyueyi1995/oa 

---
## 基本任务  

- A 后台管理员的登录注册  
- B 已经在EVA平台上注册的用户信息管理  
- C 用户的角色管理  
- D 机构管理  
- E 项目管理  
 

---
## 完成度  

基本的MVC结构已经完成；  
任务A已全部完成，包括注册、登录、session读写；  
任务B已全部完成，包括信息查询、添加、删除、修改基本信息、修改密码；   
     
      

--- 
## TODOs  
使用handlebars语义模板替代for循环以及字符串拼接工作，提高安全性和性能。 

