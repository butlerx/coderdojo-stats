var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');
var json2csv = require('json2csv');

module.exports = function (startDate, eventCount, applicationCount, ticketType, verifiedAt) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    var db = ctx.db;
    var recent = moment(startDate);
    var bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    return db.eventsDB('cd_events')
      .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
      .select(db.eventsDB.raw('count(*), cd_applications.event_id'))
      .whereRaw('cd_events.created_at > \'' + recent.format('YYYY-MM-DD') + '\'')
      .and.where('cd_applications.ticket_type', '=', ticketType)
      .and.whereRaw('cd_applications.attendance::text != \'{}\'')
      .whereNotNull('cd_applications.attendance')
      .groupByRaw('cd_applications.event_id')
      .havingRaw('count(*) >= ' + applicationCount || 1)
    .then(function (events) {
      return db.eventsDB('cd_events')
      .select(db.eventsDB.raw('count(*), cd_events.dojo_id'))
      .whereIn('id', _.map(events, 'event_id'))
      .groupByRaw('cd_events.dojo_id')
      .havingRaw('count(*) < ' + eventCount || 1);
    })
    .then(function (dojos) {
      if (verifiedAt) {
        return bases.dojos.activeDojos(null, verifiedAt).and.whereIn('id', _.map(dojos, 'dojo_id'));
      }
      return dojos;
    })
    .then(function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of Dojos Using Events With less than ' + eventCount + ' events with at least ' + applicationCount + ' ' + ticketType + ' attendants checkedIn since ' + startDate + ' and verified since ' + verifiedAt + ': ' + rows.length +
        '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
