const moment = require('moment');
const Promise = require('bluebird');
const fs = require('fs');
const _ = require('lodash');

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType
 * @return {[type]}           [description]
 */
module.exports = (startDate, role) => function () {
  console.log(__filename.slice(__dirname.length + 1));

  const ctx = this;
  const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
  const recent = moment(startDate);
  return bases.dojos
    .byRoleType('user_id', role)
    .then(users =>
      ctx.db
        .usersDB('cd_profiles')
        .select('cd_profiles.user_id')
        .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
        .whereRaw(`sys_user.when > '${recent.format('YYYY-MM-DD')}'`)
        .and.whereNotNull('cd_profiles.badges')
        .and.whereRaw("cd_profiles.badges::text != '{}'")
        .and.whereIn('cd_profiles.user_id', _.map(users, 'user_id')))
    .then(rows => {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, `\nCount of users with badges being a ${role} since ${startDate}: ${rows.length}\n`);
      }
      return Promise.resolve(rows);
    });
};
