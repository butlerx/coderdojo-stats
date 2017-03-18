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
  return bases.users
    .usersByType('cd_profiles.user_id', userType)
    .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
    .whereRaw(`sys_user.when > '${recent.format('YYYY-MM-DD')}'`)
    .and.whereNotNull('cd_profiles.badges')
    .and.whereRaw("cd_profiles.badges::text != '{}'")
    .then(rows => {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, `\nCount of users for ${userType} with Badges since ${startDate}: ${rows.length}\n`);
      }
      return Promise.resolve(rows);
    });
};
