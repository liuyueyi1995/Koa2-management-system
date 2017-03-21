var ds = require('../datasource');

// Managers表示可以登录到后台管理系统的用户
const Managers = ds.bookshelf.Model.extend({
    tableName: 'background_managers'
});

// Users表示可以登录到EVA的用户
const Users = ds.bookshelf.Model.extend({
    tableName: 'users',
    hasTimestamps: true,
    role: function() {
        return this.hasOne(Roles);
    }
});

// Roles表示角色
const Roles = ds.bookshelf.Model.extend({
    tableName: 'roles',
    hasTimestamps: true,
    user: function() {
        return this.belongsTo(Users);
    },
    study: function() {
        return this.belongsTo(Studies);
    },
    site: function() {
        return this.belongsTo(Sites);
    }
});

// Studies表示研究项目
const Studies = ds.bookshelf.Model.extend({
    tableName: 'studies',
    hasTimestamps: true,
    role: function() {
        return this.hasOne(Roles);
    },
    study_site: function() {
        return this.hasOne(Study_Sites);
    }
});

// Sites表示研究机构
const Sites = ds.bookshelf.Model.extend({
    tableName: 'sites',
    hasTimestamps: true,
    role: function() {
        return this.hasOne(Roles);
    },
    study_site: function() {
        return this.hasOne(Study_Sites);
    }
});

// Study_Sites表示项目-机构关系表
const Study_Sites = ds.bookshelf.Model.extend({
    tableName: 'study_sites',
    hasTimestamps: true,
    study: function() {
        return this.belongsTo(Studies);
    },
    site: function() {
        return this.belongsTo(Sites);
    }
});
// Logs表示系统产生的日志
const Logs = ds.bookshelf.Model.extend({
    tableName: 'logs',
    hasTimestamps: true
});



module.exports = {
    Managers:Managers,
    Users: Users,
    Roles:Roles, 
    Studies: Studies,
    Sites:Sites,
    Study_Sites:Study_Sites,
    Logs: Logs
}