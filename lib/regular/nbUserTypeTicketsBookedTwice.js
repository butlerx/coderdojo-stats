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
module.exports = function (startDate, userType) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    var db = ctx.db;
    var nbUserTypeTicketsBooked = require('./nbUserTypeTicketsBooked')(startDate, userType);
    var recent = moment(startDate);
    return db.eventsDB('cd_events')
    .join('cd_applications', 'cd_events.id', 'cd_applications.event_id')
    .select(db.eventsDB.raw('cd_applications.user_id, count(*)'))
    .whereRaw('cd_events.created_at > \'' + recent.format("YYYY-MM-DD") +'\'')
    .and.where('ticket_type', '=', userType)
    .groupBy('cd_applications.user_id')
    .havingRaw('count(*) > 1')
    .then( function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of ticket booked twice for ' + userType + ' since ' + startDate + ': ' + rows.length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
