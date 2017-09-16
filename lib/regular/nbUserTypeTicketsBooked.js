import moment from 'moment';
import events from '../bases/events';
import { log, append } from '../util';

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType  Ticket type, doesnt select upon usertype so stats are partially wrong
 * @return {[type]}           [description]
 */
export default async function nbUserTypeTicketsBooked(startDate, userType, minAttendances) {
  try {
    const db = this.db;
    const dbHelper = events(db.eventsDB);
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
          .whereRaw(`dates.startTime > '${recent.format('YYYY-MM-DD')}'`),
      )
      .and.where('ticket_type', '=', userType)
      .groupBy('cd_applications.user_id');
    if (minAttendances) {
      req.havingRaw(`count(*) > ${minAttendances}`);
    }
    const rows = await req;
    if (this.output) {
      append(
        this.filename,
        `\nCount of ticket booked at least ${(minAttendances || 0) +
          1} times for ${userType} since ${startDate}: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
