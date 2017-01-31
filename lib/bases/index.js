module.exports = function (usersDB, dojosDB, eventsDB) {
  return {
    users: require('./users')(usersDB),
    dojos: require('./dojos')(dojosDB),
    events: require('./events')(eventsDB)
  };
};
