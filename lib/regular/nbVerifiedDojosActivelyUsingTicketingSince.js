var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');

module.exports = function (verifiedSince, lastDateOfPeriod, qtyEvents, userType, qtyUserType) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));
    var dojosWithRegularEventsBookedType = require('../common/dojosWithRegularEventsBookedType')(lastDateOfPeriod, qtyEvents, userType, qtyUserType);
    var ctx = this;
    // users w/ badges
    //  with date received > startDate
    // dojo relationship
    // uniq dojos
    var bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    return dojosWithRegularEventsBookedType.bind(_.omit(ctx, 'output'))()
    .then(function (dojos) {
      return bases.dojos.activeDojos(null, verifiedSince)
      .then(function (activeDojos) {
        return ctx.db.dojosDB('cd_dojos')
        .whereIn('id', _.map(activeDojos, 'id'))
        .and.whereIn('id', _.map(dojos, 'dojo_id'));
      });
    })
    .then(function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of Dojos Using Events With at least ' + qtyUserType + ' ' + userType + ' who checked in and has been veriified since ' + verifiedSince + ': ' + rows.length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
