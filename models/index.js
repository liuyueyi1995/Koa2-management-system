var ds = require('../datasource');

// Users表示可以登录到这个系统的用户
const Managers = ds.bookshelf.Model.extend({
    tableName: 'background_managers'
});

// Users表示可以登录到这个系统的用户
const Users = ds.bookshelf.Model.extend({
    tableName: 'users',
    role: function() {
        return this.hasOne(Roles);
    }
});

// Studies表示研究项目
const Studies = ds.bookshelf.Model.extend({
    tableName: 'studies',
    role: function() {
        return this.hasOne(Roles);
    }
});

// Sites表示研究机构
const Sites = ds.bookshelf.Model.extend({
    tableName: 'sites',
    role: function() {
        return this.hasOne(Roles);
    }
});

// Logs表示系统产生的日志
const Logs = ds.bookshelf.Model.extend({
    tableName: 'logs'
});


// Roles表示角色
const Roles = ds.bookshelf.Model.extend({
    tableName: 'roles',
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

module.exports = {
    Managers:Managers,
    Users: Users,
    Roles:Roles, 
    Studies: Studies,
    Sites:Sites,
    Logs: Logs
}