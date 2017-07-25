const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');

/**
 * Care, it does filter upon usertype
 * @param  {[type]} lastDateOfPeriod [description]
 * @return {[type]}                  [description]
 */
module.exports = (lastDateOfPeriod, qtyEvents, userType, qtyUserType) =>
  function () {
    console.log(__filename.slice(__dirname.length + 1));
    const ctx = this;
    const db = ctx.db;
    const dojosWithRegularEvents = require('./dojosWithRegularEvents')(lastDateOfPeriod, qtyEvents);
    // NOTE : we ignore recurrent events attendances?
    return dojosWithRegularEvents.bind(_.omit(ctx, 'output'))()
      .then(dojoIds =>
        db
          .eventsDB('cd_events')
          .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
          .select(db.eventsDB.raw('count(*) as counted, cd_applications.dojo_id'))
          .whereNotNull('cd_applications.attendance')
          .and.whereRaw("cd_applications::text != '{}'")
          .andWhere('cd_applications.dojo_id', 'in', dojoIds)
          .andWhere('cd_applications.ticket_type', '=', userType)
          .and.groupByRaw('cd_applications.dojo_id')
          .and.havingRaw(`count(*) > ${qtyUserType}`)
      )
      .then(rows => {
        if (ctx.output) {
          fs.appendFileSync(
            ctx.filename,
            `\nCount of Dojos Using Events With at least ${qtyUserType}${userType} who checked in: ${rows.length}\n`
          );
        }
        return Promise.resolve(rows);
      });
  };
