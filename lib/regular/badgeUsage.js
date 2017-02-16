var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');

module.exports = function (startDate) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    // users w/ badges
    //  with date received > startDate
    // dojo relationship
    // uniq dojos
    var bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    return ctx.db.usersDB.from(bases.users.flattenedBadges())
    .select(ctx.db.usersDB.raw('badges.badge->>\'slug\' as slug, count(badges.badge->>\'slug\')'))
    .whereRaw('badges.badge->>\'created\' > \'' + startDate + '\'')
    .or.whereRaw('badges.badge->>\'dateAccepted\' > \'' + startDate + '\'')
    .groupByRaw('badges.badge->>\'slug\'')
    .orderByRaw('count(badges.badge->>\'slug\') desc')
    .then(function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nStats of usage per badge since ' + startDate + ':\n');
        _.each(rows, function (row) {
          fs.appendFileSync(ctx.filename, row.slug + ' ; ' + row.count + '\n');
        });
      }
      return Promise.resolve(rows);
    });
  };
};
