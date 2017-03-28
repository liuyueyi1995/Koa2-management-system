# management_system 
## 简介
这是一个基于`koa2`的后台管理系统 

使用 `jQuery` 作为前端JS框架  
使用 `bootstrap` 作为CSS框架  
使用 `pug`/`jade` 和 `handlebars` 作为HTML页面模板  
使用 `PostgreSql` 存储业务数据   
使用 `mongodb` 存储 `session`   
使用 `Bookshelf` + `Knex` 作为 `ORM` 和 `Query Builder`  
使用 `Sentry` 作为错误信息的收集反馈平台   
采用 `AJAX` 处理前端请求     
使用 `CronJob` 库完成定时任务的执行 

目录结构和babel的配置参考了 https://github.com/17koa/koa-demo   
原链接似乎已经被删掉了，这个是我fork过来的版本 https://github.com/liuyueyi1995/koa2-demo    
网站的前端代码来源于我之前的一个项目  https://github.com/liuyueyi1995/oa 

---
## 基本任务  

- A 后台管理员的登录注册  
- B 用户信息管理  
- C 用户角色管理  
- D 机构管理  
- E 项目管理  
- F 通过后端分页+`AJAX`显示查询和搜索得到的内容  
- G 临时用户的创建和临时角色的分配与回收  

---
## 完成度  

- 基本的MVC结构已经完成；  
- 任务A已全部完成，包括注册、登录、session读写；  
- 任务B已全部完成，包括用户信息查询、模糊搜索、添加、删除、修改基本信息、修改密码；  
- 任务C已全部完成，包括多表查询、模糊搜索、级联下拉菜单的处理、信息添加和删除；  
- 任务D已全部完成，包括机构信息查询、模糊搜索、添加、删除、修改；  
- 任务E已全部完成，包括项目信息查询、模糊搜索、添加、删除、修改； 
- 任务F已全部完成，通过判断分页按钮点击事件触发时搜索框是否有内容，来决定后台返回的结果集，实时监听搜索框内容，当内容被清空时，刷新页面；    
- 任务G已全部完成，通过将用户区分为内部和外部，采用不同的密码生成方式，给角色增加过期时间的属性，后台定期清理过期的角色信息；   
- 表单的呈现形式做了改良，下拉菜单已经修改完成、加入了日期控件、对于布尔值输入采用radio的形式；    
- 已经关联了用户登录及数据管理两部分功能；   
- 已经完成外部角色与内部角色的区分，已经完成角色的截止日期设定；  


--- 
## TODOs     

- 对于日期、数字、布尔值的查询还有待完善(例如：timestamp、boolean)；  
- 对于用户输入的校验还有待完善(例如：email、phone)；  
- 对于数据的添加和修改还没有做判重(例如：当要添加的数据与已有数据发生冲突时，后台会报错，但还没有把相关信息告知前端)；     
- 将信息提示改成更友善的方式，替换原来的`alert`；    
- 提高代码复用的程度；  

---
## focus
repo中已经将包含敏感信息的`config.js`文件删除掉，使用时需要额外添加：
```
var config = {
    database: '',
    username: '',
    password: '',
    host: '',
    port: 
};

module.exports = config;
```
---
## ISSUEs  

- 级联菜单，有bug，初始时，在没有改变`type`的情况下，`site`的列表出不来。 
  + 已解决。  
    * 应该是`onchange`的问题，
    * 通过给`type`下拉菜单增加一个默认的空值，强制用户去改变它。 
- 修改数据库之后，`updated_at`值没有变化。  
  + 已解决。  
    * 在`model`定义的时候加上`hasTimestamps:true`即可。  
- 修改数据库之后，列表的顺序会被打乱。  
  + 已解决。  
    * 在数据库返回搜索结果前使用`orderBy`进行排序。   
- 角色管理页，site值为空时，偶尔会出现添加失败的状况。 
  + 已解决。  
    * 前端`null`传回后端时变成了空字符串，与外键的`integer`类型冲突。   
- 分页之后，如果修改了后面的内容，修改成功之后会跳转回第一页。  
  + **未解决**。  
    * 应该是`reload`的问题。 
- 分页之后，搜索结果如果有多页内容，点击第二页，会返回原始结果的第二页。 
  + 已解决。  
    * 因为现在只有一个分页的`AJAX`处理，如果要让搜索后的结果可以分页展示，就需要再加一个状态，  
    * 在原有分页基础上增加判断，  
    * 如果此时搜索框内有内容，则会带着这个内容去查询数据库，并返回对应页的内容；  
    * 如果此时搜索框为空，则返回原始数据对应页的内容。  
- 搜索之后，分页组件的页面数量不正确，例如原始结果有5页，但是搜索结果只有2页，但仍然会显示5个页码按钮。  
  + 已解决。  
    * 搜索之后获取到结果的条目数，重绘分页按钮。  
- 多次搜索时，分页组件的页面数量不正确，例如第一次搜索结果有2页，第二次搜索结果有3页，但仍然只显示2个页码按钮。   
  + 已解决。  
    * 实时获取搜索框的内容，当其内容变为空时，刷新页面。  
- 使用`handlebars`模板的时候，时间戳解析不正确。  
  + 已解决。  
    * 使用自定义`helper`解析时间戳。  
- 未登录的情况下，通过修改URL会跳过登录，直接操作数据库。  
  + 已解决。  
    * 在每个`get`请求返回之前，加入`session`的判断，`session`为空则跳转到`login`页。  
- 针对内部用户的删除需要join，pgsql的delete只支持`using`，bookshelf不支持`using`。 
  + 已解决。  
    * 改用`knex`直接完成查询。  
