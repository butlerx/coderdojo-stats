const Promise = require('bluebird');
const fs = require('fs');

module.exports = function () {
  console.log(__filename.slice(__dirname.length + 1));
  const ctx = this;
  const db = ctx.db;
  return db
    .eventsDB('cd_events')
    .select()
    .where('created_at', '>', ctx.monthAgo.format('YYYY-MM-DD HH:mm:ss'))
    .then(rows => {
      if (ctx.output) {
        fs.appendFileSync(
          ctx.filename,
          `\nTotal Count of Events since ${ctx.monthAgo.format('YYYY-MM-DD HH:mm')}: ${rows.length}\n`
        );
      }
      return Promise.resolve(rows);
    })
    .catch(error => {
      console.error(error);
    });
};
