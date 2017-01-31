var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');
var json2csv = require('json2csv');

/**
 * Care, it does filter upon usertype
 * @param  {[type]} lastDateOfPeriod [description]
 * @return {[type]}                  [description]
 */
module.exports = function (lastDateOfPeriod, qtyEvents, userType, qtyUserType) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));
    var ctx = this;
    var db = ctx.db;
    var dojosWithRegularEvents = require('./dojosWithRegularEvents')(lastDateOfPeriod, qtyEvents);
    return dojosWithRegularEvents.bind(_.omit(ctx, 'output'))()
    .then(function (dojoIds) {
      return db.eventsDB('cd_events').join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
        .select(db.eventsDB.raw('count(*) as counted, cd_applications.dojo_id'))
        .whereNotNull('cd_applications.attendance')
        .and.whereRaw('cd_applications::text != \'{}\'')
        .andWhere('cd_applications.dojo_id', 'in', dojoIds)
        .andWhere('cd_applications.ticket_type', '=', userType)
        .and.groupByRaw('cd_applications.dojo_id')
        .and.havingRaw('count(*) > ' + qtyUserType);
    })
    .then(function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of Dojos Using Events With at least 2 ninjas who checked in: ' + rows.length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
