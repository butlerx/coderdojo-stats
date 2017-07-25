import _ from 'lodash';
import dojosRegularEvents from './dojosWithRegularEvents';
import { log, append } from '../util';

/**
 * Care, it does filter upon usertype
 * @param  {[type]} lastDateOfPeriod [description]
 * @return {[type]}                  [description]
 */
export default async function dojosWithRegularEventsBookedType(
  lastDateOfPeriod,
  qtyEvents,
  userType,
  qtyUserType,
) {
  const db = this.db;
  try {
    const dojosWithRegularEvents = await dojosRegularEvents(lastDateOfPeriod, qtyEvents);
    // NOTE : we ignore recurrent events attendances?
    const dojoIds = await dojosWithRegularEvents.bind(_.omit(this, 'output'))();
    const rows = await db
      .eventsDB('cd_events')
      .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
      .select(db.eventsDB.raw('count(*) as counted, cd_applications.dojo_id'))
      .whereNotNull('cd_applications.attendance')
      .and.whereRaw("cd_applications::text != '{}'")
      .andWhere('cd_applications.dojo_id', 'in', dojoIds)
      .andWhere('cd_applications.ticket_type', '=', userType)
      .and.groupByRaw('cd_applications.dojo_id')
      .and.havingRaw(`count(*) > ${qtyUserType}`);
    if (this.output) {
      await append(
        this.filename,
        `\nCount of Dojos Using Events With at least ${qtyUserType}${userType} who checked in: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
