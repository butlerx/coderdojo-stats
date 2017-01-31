var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');
var json2csv = require('json2csv');

module.exports = function (startDate) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    var db = ctx.db;
    var recent = moment(startDate);
    return db.eventsDB('cd_events')
    .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
    .select(db.eventsDB.raw('count(*), cd_applications.dojo_id'))
    .whereRaw('cd_events.created_at > \'' + recent.format("YYYY-MM-DD") +'\'')
    .whereNotNull('cd_applications.attendance')
    .and.whereRaw('cd_applications::text != \'{}\'')
    .groupByRaw('cd_applications.dojo_id')
    .havingRaw('count(*) >= 1')
    .then( function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of Dojos Using Events With at least a checked_in attendant since ' + startDate + ': ' + rows.length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
