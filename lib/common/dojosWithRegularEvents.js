const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const fs = require('fs');

module.exports = (lastDateOfPeriod, qtyEvents) => function () {
  console.log(__filename.slice(__dirname.length + 1));
  const ctx = this;
  const db = ctx.db;
  const recent = moment(lastDateOfPeriod).month(3);
  const dojoIds = {};
  return db.eventsDB('cd_events').select('dates', 'dojo_id').then(rows => {
    for (const i in rows) {
      for (let j = 0; j < rows[i].dates.length; j++) {
        if (rows[i].dates[j].startTime > recent.format()) {
          if (dojoIds[rows[i].dojo_id]) {
            dojoIds[rows[i].dojo_id] += 1;
          } else {
            dojoIds[rows[i].dojo_id] = 1;
          }
          j = rows[i].dates.length;
        }
      }
    }
    const validDojosIds = _.pickBy(dojoIds, qty => qty >= qtyEvents);
    if (ctx.output) {
      fs.appendFileSync(ctx.filename, `\nDojos Createing at least ${qtyEvents} events recently (since ${lastDateOfPeriod} for 3 months): ${_.keys(validDojosIds).length}\n`);
    }
    return Promise.resolve(_.keys(validDojosIds));
  });
};
