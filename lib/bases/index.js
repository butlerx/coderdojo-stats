import users from './users';
import dojos from './dojos';
import events from './events';

export default (usersDB, dojosDB, eventsDB) => ({
  users: users(usersDB),
  dojos: dojos(dojosDB),
  events: events(eventsDB),
});
