var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');

module.exports = function (startDate, minBadgesForPeriod, userTypes, excluded, target) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    // users w/ badges
    //  with date received > startDate
    // dojo relationship
    // uniq dojos
    var bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    return ctx.db.usersDB.from(bases.users.flattenedBadges())
    .select('user_id')
    .whereRaw('badges.badge->>\'created\' > \'' + startDate + '\'')
    .or.whereRaw('badges.badge->>\'dateAccepted\' > \'' + startDate + '\'')
    .modify(function (queryBuilder) {
      if (userTypes) queryBuilder.and.whereIn('user_id', bases.users.usersByType('user_id', userTypes));
    })
    .modify(function (queryBuilder) {
      if (excluded) queryBuilder.and.whereNotIn(ctx.db.usersDB.raw('badges.badge->>\'slug\''), excluded);
    })
    .join('cd_profiles as cdp', 'badges.id', 'cdp.id')
    .then(function (profiles) {
      if (target === 'dojos') {
        return ctx.db.dojosDB('cd_usersdojos')
        .select('dojo_id')
        .count('dojo_id')
        .whereIn('user_id', _.map(profiles, 'user_id'))
        .groupBy('dojo_id')
        .havingRaw('count(dojo_id) > ' + minBadgesForPeriod);
      } else if (target === 'users' || target === 'badges') {
        return profiles;
      } else {
        throw new Error('Missing parameter in nbDojos');
      }
    })
    .then(function (rows) {
      if (ctx.output) {
        var string = '';
        var length = 0;
        if (target === 'dojos') {
          string = '\nCount of dojo who issued at least ' + minBadgesForPeriod + ' badge since ' + startDate;
          length = _.uniq(_.map(rows, 'dojo_id')).length;
        } else if (target === 'users') {
          string = '\nCount of users with usertype ' + userTypes + ' who were issued badges since ' + startDate;
          length = _.uniq(_.map(rows, 'user_id')).length;
        } else if (target === 'badges') {
          string = '\nCount of badges who were issued badges since ' + startDate + ' for userTypes ' + userTypes;
          length = _.map(rows, 'user_id').length;
        } else {
          throw new Error('Missing parameter in nbDojos');
        }
        if (excluded) string += ' with ' + excluded.length + ' badges excluded';
        fs.appendFileSync(ctx.filename, string + ' : ' + length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
