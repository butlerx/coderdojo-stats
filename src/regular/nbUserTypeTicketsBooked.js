const moment = require('moment');
const Promise = require('bluebird');
const fs = require('fs');

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType  Ticket type, it does not select upon the usertype so that the stats is partially wrong
 * @return {[type]}           [description]
 */
module.exports = (startDate, userType, minAttendances) =>
  function () {
    console.log(__filename.slice(__dirname.length + 1));

    const ctx = this;
    const db = ctx.db;
    const dbHelper = require('./../bases/events')(db.eventsDB);
    const recent = moment(startDate);
    const req = db
      .eventsDB('cd_events')
      .join('cd_applications', 'cd_events.id', 'cd_applications.event_id')
      .select(db.eventsDB.raw('cd_applications.user_id, count(*) as counted'))
      .whereIn(
        'cd_events.id',
        db.eventsDB
          .from(dbHelper.flattenedEventDates())
          .select('dates.id')
          .whereRaw(`dates.startTime > '${recent.format('YYYY-MM-DD')}'`)
      )
      .and.where('ticket_type', '=', userType)
      .groupBy('cd_applications.user_id');
    if (minAttendances) {
      req.havingRaw(`count(*) > ${minAttendances}`);
    }
    return req.then(rows => {
      if (ctx.output) {
        fs.appendFileSync(
          ctx.filename,
          `\nCount of ticket booked at least ${(minAttendances || 0) +
            1} times for ${userType} since ${startDate}: ${rows.length}\n`
        );
      }
      return Promise.resolve(rows);
    });
  };
