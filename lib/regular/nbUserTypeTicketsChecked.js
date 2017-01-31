var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');
var json2csv = require('json2csv');

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType  Ticket type, it does not select upon the usertype so that the stats is partially wrong
 * @return {[type]}           [description]
 */
module.exports = function (startDate, userType, minAttendances) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    var db = ctx.db;
    var dbHelper = require('./../bases/events')(db.eventsDB);
    var recent = moment(startDate);
    var req = db.eventsDB('cd_events')
    .join('cd_applications', 'cd_events.id', 'cd_applications.event_id')
    .select(db.eventsDB.raw('cd_applications.user_id, count(*) as counted'))
    .whereIn('cd_events.id', db.eventsDB.from(dbHelper.flattenedEventDates()).select('dates.id').whereRaw('dates.startTime > \'' + recent.format("YYYY-MM-DD") +'\''))
    // We do both to ensure that the attendance hasn't been done POST month of the event itself, which defeats a bit the goal of attendance
    .whereIn('cd_applications.id', db.eventsDB.from(dbHelper.flattenedAttendances()).select('attendances.id').whereRaw('attendances.date > \'' + recent.format("YYYY-MM-DD") +'\''))
    .and.where('ticket_type', '=', userType)
    .groupBy('cd_applications.user_id');

    if (minAttendances) {
      req.havingRaw('count(*) > ' + minAttendances);
    }
    return req
    .then( function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of ticket checkedIn at least ' + ((minAttendances|| 0) + 1) + ' times for ' + userType + ' since ' + startDate + ': ' + rows.length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
