var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');
var json2csv = require('json2csv');

module.exports = function (startDate, eventCount, verifiedAt) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    var db = ctx.db;
    var recent = moment(startDate);
    var bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    return db.eventsDB('cd_events')
      .select(db.eventsDB.raw('count(*), cd_events.dojo_id'))
      .groupByRaw('cd_events.dojo_id')
      .whereRaw('cd_events.created_at > \'' + recent.format('YYYY-MM-DD') + '\'')
      .havingRaw('count(*) < ' + eventCount || 1)
    .then(function (dojos) {
      return db.eventsDB('cd_events')
      .distinct('dojo_id')
      .then(function (dojoIds) { // Include dojos with 0 events
        return db.dojosDB('cd_dojos')
        .distinct('id')
        .whereIn('id', _.map(dojos, 'dojo_id'))
        .or.whereNotIn('id', _.map(dojoIds, 'dojo_id'));
      });
    })
    .then(function (dojos) {
      if (verifiedAt) {
        return bases.dojos.activeDojos(null, verifiedAt).and.whereIn('id', _.map(dojos, 'id'));
      }
      return dojos;
    })
    .then(function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of Dojos With less than ' + eventCount +
        ' events since ' + startDate + ' and verified since ' + verifiedAt + ': ' + rows.length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
