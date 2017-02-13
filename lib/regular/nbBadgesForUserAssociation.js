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
module.exports = function (startDate, role) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    var bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    var recent = moment(startDate);
    return bases.dojos.byRoleType('user_id', role)
    .then(function (users) {
      return ctx.db.usersDB('cd_profiles')
      .select('cd_profiles.user_id')
      .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
      .whereRaw('sys_user.when > \'' + recent.format('YYYY-MM-DD') + '\'')
      .and.whereNotNull('cd_profiles.badges')
      .and.whereRaw('cd_profiles.badges::text != \'{}\'')
      .and.whereIn('cd_profiles.user_id', _.map(users, 'user_id'));
    })
    .then(function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of users with badges being a ' + role + ' since ' + startDate + ': ' + rows.length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
