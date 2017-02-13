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
module.exports = function (role) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    var bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    return bases.dojos.activeDojos()
    .then(function (dojos) {
      return bases.dojos.byRawRoleType('user_id, dojo_id', role)
      .whereIn('dojo_id', _.map(dojos, 'id'));
    })
    .then(function (associations) {
      return ctx.db.usersDB('cd_profiles').distinct('user_id').whereIn('user_id', _.map(associations, 'user_id'));
    })
    .then(function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of joined users for ' + role + ' at current date :' + rows.length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
