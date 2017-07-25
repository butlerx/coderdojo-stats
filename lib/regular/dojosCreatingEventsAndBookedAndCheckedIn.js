import moment from 'moment';
import { log, append } from '../util';

export default async function dojosCreatingEventsAndBookedAndCheckedIn(startDate) {
  try {
    const db = this.db;
    const recent = moment(startDate);
    const rows = await db
      .eventsDB('cd_events')
      .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
      .select(db.eventsDB.raw('count(*), cd_applications.dojo_id'))
      .whereRaw(`cd_events.created_at > '${recent.format('YYYY-MM-DD')}'`)
      .whereNotNull('cd_applications.attendance')
      .and.whereRaw("cd_applications::text != '{}'")
      .groupByRaw('cd_applications.dojo_id')
      .havingRaw('count(*) >= 1');
    if (this.output) {
      await append(
        this.filename,
        `\nCount of Dojos Using Events With at least a checked_in attendant since ${startDate}: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
