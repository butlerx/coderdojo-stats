const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const fs = require('fs');

module.exports = (startDate, eventCount, applicationCount, ticketType, verifiedAt) => function () {
  console.log(__filename.slice(__dirname.length + 1));

  const ctx = this;
  const db = ctx.db;
  const recent = moment(startDate);
  const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
  return db
    .eventsDB('cd_events')
    .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
    .select(db.eventsDB.raw('count(*), cd_applications.event_id'))
    .whereRaw(`cd_events.created_at > '${recent.format('YYYY-MM-DD')}'`)
    .and.where('cd_applications.ticket_type', '=', ticketType)
    .groupByRaw('cd_applications.event_id')
    .havingRaw(`count(*) >= ${applicationCount}` || 1)
    .then(events =>
      db
        .eventsDB('cd_events')
        .select(db.eventsDB.raw('count(*), cd_events.dojo_id'))
        .whereIn('id', _.map(events, 'event_id'))
        .groupByRaw('cd_events.dojo_id')
        .havingRaw(`count(*) >= ${eventCount}` || 1))
    .then(dojos => {
      if (verifiedAt) {
        return bases.dojos.activeDojos(null, verifiedAt).and.whereIn('id', _.map(dojos, 'dojo_id'));
      }
      return dojos;
    })
    .then(rows => {
      if (ctx.output) {
        fs.appendFileSync(
          ctx.filename,
          `\nCount of Dojos Using Events With at least ${eventCount} events with at least ${applicationCount} ${ticketType} attendants since ${startDate} and verified since ${verifiedAt}: ${rows.length}\n`
        );
      }
      return Promise.resolve(rows);
    });
};
