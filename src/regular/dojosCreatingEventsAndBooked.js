const moment = require('moment');
const Promise = require('bluebird');
const fs = require('fs');

module.exports = (startDate, count) =>
  function () {
    console.log(__filename.slice(__dirname.length + 1));

    const ctx = this;
    const db = ctx.db;
    const recent = moment(startDate);
    return db
      .eventsDB('cd_events')
      .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
      .select(db.eventsDB.raw('count(*), cd_applications.dojo_id'))
      .whereRaw(`cd_events.created_at > '${recent.format('YYYY-MM-DD')}'`)
      .groupByRaw('cd_applications.dojo_id')
      .havingRaw(`count(*) >= ${count}` || 1)
      .then(rows => {
        if (ctx.output) {
          fs.appendFileSync(
            ctx.filename,
            `\nCount of Dojos Using Events With at least an attendant since ${startDate}: ${rows.length}\n`
          );
        }
        return Promise.resolve(rows);
      });
  };
