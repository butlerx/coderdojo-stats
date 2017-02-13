var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');
var _ = require('lodash');

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType
 * @return {[type]}           [description]
 */
module.exports = function (startDate, userType) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    var bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    var recent = moment(startDate);
    return bases.users.usersByType('cd_profiles.user_id, cd_profiles.id', userType)
    .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
    .whereRaw('sys_user.when > \'' + recent.format('YYYY-MM-DD') + '\'')
    .and.whereNotNull('cd_profiles.badges')
    .and.whereRaw('cd_profiles.badges::text != \'{}\'')
    .then(function (profiles) {
      return bases.users.flattenedBadges().whereIn('cd_profiles.id', _.map(profiles, 'id'));
    })
    .then(function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of badges for ' + userType + ' since ' + startDate + ': ' + rows.length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
