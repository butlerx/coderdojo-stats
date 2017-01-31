var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');
var json2csv = require('json2csv');



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
    var db = ctx.db;
    var bases = require('./../bases/index.js')(db.usersDB, db.dojosDB);
    var recent = moment(startDate);
    return bases.users.usersByType('cd_profiles.gender, count(*) as counted', userType)
    .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
    .whereRaw('sys_user.when > \'' + recent.format("YYYY-MM-DD") +'\'')
    .groupBy('cd_profiles.gender')
    .then(function (rows) {
      if (ctx.output) {
        _.each(rows, function(row) {
          fs.appendFileSync(ctx.filename, '\nCount of users for ' + userType + ' with gender = '+ row.gender + ' since ' + startDate + ': ' + row.counted + '\n');
        });
      }
      return Promise.resolve(rows);
    });
  };
};
