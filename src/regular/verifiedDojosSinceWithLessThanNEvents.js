const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const fs = require('fs');
const json2csv = require('json2csv');

module.exports = (startDate, eventCount, verifiedAt) =>
  function () {
    console.log(__filename.slice(__dirname.length + 1));

    const ctx = this;
    const db = ctx.db;
    const recent = moment(startDate);
    const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    return db
      .eventsDB('cd_events')
      .select(db.eventsDB.raw('count(*), cd_events.dojo_id'))
      .groupByRaw('cd_events.dojo_id')
      .whereRaw(`cd_events.created_at > '${recent.format('YYYY-MM-DD')}'`)
      .havingRaw(`count(*) < ${eventCount}` || 1)
      .then(dojos =>
        db.eventsDB('cd_events').distinct('dojo_id').then((
          dojoIds // Include dojos with 0 events
        ) =>
          db
            .dojosDB('cd_dojos')
            .distinct('id')
            .whereIn('id', _.map(dojos, 'dojo_id'))
            .or.whereNotIn('id', _.map(dojoIds, 'dojo_id'))
        )
      )
      .then(dojos => {
        if (verifiedAt) {
          return bases.dojos.activeDojos(null, verifiedAt).and.whereIn('id', _.map(dojos, 'id'));
        }
        return dojos;
      })
      .then(rows => {
        if (ctx.output) {
          fs.appendFileSync(
            ctx.filename,
            `\nCount of Dojos With less than ${eventCount} events since ${startDate} and verified since ${verifiedAt}: ${rows.length}\n`
          );
        }
        return Promise.resolve(rows);
      });
  };
