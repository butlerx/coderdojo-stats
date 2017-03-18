module.exports = (usersDB, dojosDB, eventsDB) => ({
  users : require('./users')(usersDB),
  dojos : require('./dojos')(dojosDB),
  events: require('./events')(eventsDB),
});
