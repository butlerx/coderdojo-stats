import _ from 'lodash';
import moment from 'moment';
import base from '../bases';
import { log, append } from '../util';

export default async function verifiedDojosCreatingEventsWithLessThanNEventsWithNCheckinUsertype(
  startDate,
  eventCount,
  applicationCount,
  ticketType,
  verifiedAt,
) {
  try {
    const db = this.db;
    const recent = moment(startDate);
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const events = await db
      .eventsDB('cd_events')
      .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
      .select(db.eventsDB.raw('count(*), cd_applications.event_id'))
      .whereRaw(`cd_events.created_at > '${recent.format('YYYY-MM-DD')}'`)
      .and.where('cd_applications.ticket_type', '=', ticketType)
      .and.whereRaw("cd_applications.attendance::text != '{}'")
      .whereNotNull('cd_applications.attendance')
      .groupByRaw('cd_applications.event_id')
      .havingRaw(`count(*) >= ${applicationCount}` || 1);
    const dojos = await db
      .eventsDB('cd_events')
      .select(db.eventsDB.raw('count(*), cd_events.dojo_id'))
      .whereIn('id', _.map(events, 'event_id'))
      .groupByRaw('cd_events.dojo_id')
      .havingRaw(`count(*) < ${eventCount}` || 1);
    const rows = verifiedAt
      ? bases.dojos.activeDojos(null, verifiedAt).and.whereIn('id', _.map(dojos, 'dojo_id'))
      : dojos;
    if (this.output) {
      append(
        this.filename,
        `\nCount of Dojos Using Events With less than ${eventCount} events with at least ${applicationCount} ${ticketType} attendants checkedIn since ${startDate} and verified since ${verifiedAt}: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
