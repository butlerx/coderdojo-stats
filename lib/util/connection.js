import pg from 'pg';
import knex from 'knex';

pg.types.setTypeParser(20, 'text', parseInt);

export default ({
  user,
  password,
  userHost,
  dojosHost,
  eventsHost,
  usersdb,
  dojosdb,
  eventsdb,
}) => ({
  usersDB: knex({
    client: 'pg',
    connection: {
      host: userHost || 'localhost',
      user: user || 'platform',
      password: password || 'QdYx3D5y',
      database: usersdb || 'cp-users-development',
    },
  }),
  dojosDB: knex({
    client: 'pg',
    connection: {
      host: dojosHost || 'localhost',
      user: user || 'platform',
      password: password || 'QdYx3D5y',
      database: dojosdb || 'cp-dojos-development',
    },
  }),
  eventsDB: knex({
    client: 'pg',
    connection: {
      host: eventsHost || 'localhost',
      user: user || 'platform',
      password: password || 'QdYx3D5y',
      database: eventsdb || 'cp-events-development',
    },
  }),
  usersClient: new pg.Pool({
    database: usersdb || 'cp-users-development',
    host: userHost || 'localhost',
    user: user || 'platform',
    password: password || 'QdYx3D5y',
  }),
  dojosClient: new pg.Pool({
    database: dojosdb || 'cp-dojos-development',
    host: dojosHost || 'localhost',
    user: user || 'platform',
    password: password || 'QdYx3D5y',
  }),
  eventsClient: new pg.Pool({
    database: eventsdb || 'cp-events-development',
    host: eventsHost || 'localhost',
    user: user || 'platform',
    password: password || 'QdYx3D5y',
  }),
});
