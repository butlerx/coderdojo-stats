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
module.exports = (startDate, userType) =>
  function () {
    console.log(__filename.slice(__dirname.length + 1));

    const ctx = this;
    const db = ctx.db;
    const bases = require('./../bases/index.js')(db.usersDB, db.dojosDB);
    const recent = moment(startDate);
    return bases.users
      .usersByType('cd_profiles.gender, count(*) as counted', userType)
      .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
      .whereRaw(`sys_user.when > '${recent.format('YYYY-MM-DD')}'`)
      .groupBy('cd_profiles.gender')
      .then(rows => {
        if (ctx.output) {
          _.each(rows, ({ gender, counted }) => {
            fs.appendFileSync(
              ctx.filename,
              `\nCount of users for ${userType} with gender = ${gender} since ${startDate}: ${counted}\n`
            );
          });
        }
        return Promise.resolve(rows);
      });
  };
