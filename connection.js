var pg = require('pg');

pg.types.setTypeParser(20, 'text', parseInt);

module.exports = function (user, password, db) {
  var exported = {
    usersDB : require('knex')({
     client: 'pg',
     connection: {
       host     : '127.0.0.1',
       user     : user,
       password : password,
       database : db.usersdb
     }
   }),
   dojosDB : require('knex')({
     client: 'pg',
     connection: {
       host     : '127.0.0.1',
       user     : user,
       password : password,
       database : db.dojosdb
     }
   }),
   eventsDB : require('knex')({
     client: 'pg',
     connection: {
       host     : '127.0.0.1',
       user     : user,
       password : password,
       database : db.eventsdb
     }
   }),
   usersClient : new pg.Client({
     database: db.usersdb,
     user: user,
     password: password
   }),
   dojosClient : new pg.Client({
     database: db.dojosdb,
     user: user,
     password: password
   }),
   eventsClient : new pg.Client({
     database: db.eventsdb,
     user: user,
     password: password
    })
  };

  return exported;
};
