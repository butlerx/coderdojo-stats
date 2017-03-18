const pg = require('pg');

pg.types.setTypeParser(20, 'text', parseInt);

module.exports = (user, password, { usersdb, dojosdb, eventsdb }) => {
  const exported = {
    usersDB: require('knex')({
      client    : 'pg',
      connection: {
        host    : '127.0.0.1',
        user,
        password,
        database: usersdb,
      },
    }),
    dojosDB: require('knex')({
      client    : 'pg',
      connection: {
        host    : '127.0.0.1',
        user,
        password,
        database: dojosdb,
      },
    }),
    eventsDB: require('knex')({
      client    : 'pg',
      connection: {
        host    : '127.0.0.1',
        user,
        password,
        database: eventsdb,
      },
    }),
    usersClient: new pg.Client({
      database: usersdb,
      user,
      password,
    }),
    dojosClient: new pg.Client({
      database: dojosdb,
      user,
      password,
    }),
    eventsClient: new pg.Client({
      database: eventsdb,
      user,
      password,
    }),
  };

  return exported;
};
