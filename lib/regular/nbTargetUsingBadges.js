const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');

module.exports = (startDate, minBadgesForPeriod, userTypes, excluded, target) => function () {
  console.log(__filename.slice(__dirname.length + 1));

  const ctx = this;
  // users w/ badges
  //  with date received > startDate
  // dojo relationship
  // uniq dojos
  const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
  return ctx.db.usersDB
    .from(bases.users.flattenedBadges())
    .select('user_id')
    .whereRaw(`badges.badge->>'created' > '${startDate}'`)
    .or.whereRaw(`badges.badge->>'dateAccepted' > '${startDate}'`)
    .modify(({ and }) => {
      if (userTypes) and.whereIn('user_id', bases.users.usersByType('user_id', userTypes));
    })
    .modify(({ and }) => {
      if (excluded) and.whereNotIn(ctx.db.usersDB.raw("badges.badge->>'slug'"), excluded);
    })
    .join('cd_profiles as cdp', 'badges.id', 'cdp.id')
    .then(profiles => {
      if (target === 'dojos') {
        return ctx.db
          .dojosDB('cd_usersdojos')
          .select('dojo_id')
          .count('dojo_id')
          .whereIn('user_id', _.map(profiles, 'user_id'))
          .groupBy('dojo_id')
          .havingRaw(`count(dojo_id) > ${minBadgesForPeriod}`);
      } else if (target === 'users' || target === 'badges') {
        return profiles;
      } else {
        throw new Error('Missing parameter in nbDojos');
      }
    })
    .then(rows => {
      if (ctx.output) {
        let string = '';
        let length = 0;
        if (target === 'dojos') {
          string = `\nCount of dojo who issued at least ${minBadgesForPeriod} badge since ${startDate}`;
          length = _.uniq(_.map(rows, 'dojo_id')).length;
        } else if (target === 'users') {
          string = `\nCount of users with usertype ${userTypes} who were issued badges since ${startDate}`;
          length = _.uniq(_.map(rows, 'user_id')).length;
        } else if (target === 'badges') {
          string = `\nCount of badges who were issued badges since ${startDate} for userTypes ${userTypes}`;
          length = _.map(rows, 'user_id').length;
        } else {
          throw new Error('Missing parameter in nbDojos');
        }
        if (excluded) string += ` with ${excluded.length} badges excluded`;
        fs.appendFileSync(ctx.filename, `${string} : ${length}\n`);
      }
      return Promise.resolve(rows);
    });
};
