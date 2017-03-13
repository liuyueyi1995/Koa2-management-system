const config = require('./config');
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: config.host,
        user: config.username,
        password : config.password,
        database : config.database,
        port: config.port
    }
});
const bookshelf = require('bookshelf')(knex);

module.exports = {
    knex: knex,
    bookshelf: bookshelf
}