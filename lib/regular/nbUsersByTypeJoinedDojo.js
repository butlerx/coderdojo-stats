const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const fs = require('fs');

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType
 * @return {[type]}           [description]
 */
module.exports = (startDate, userType) => function () {
  console.log(__filename.slice(__dirname.length + 1));

  const ctx = this;
  const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
  const recent = moment(startDate);
  return ctx.db
    .dojosDB('cd_usersdojos')
    .then(associations =>
      bases.users
        .usersByType('cd_profiles.user_id', userType)
        .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
        .whereRaw(`sys_user.when > '${recent.format('YYYY-MM-DD')}'`)
        .whereIn('user_id', _.map(associations, 'user_id')))
    .then(rows => {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, `\nCount of joined users for ${userType} since ${startDate}: ${rows.length}\n`);
      }
      return Promise.resolve(rows);
    });
};
