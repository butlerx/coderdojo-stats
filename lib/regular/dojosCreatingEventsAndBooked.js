import moment from 'moment';
import { log, append } from '../util';

export default async function dojosCreatingEventsAndBooked(startDate, count) {
  try {
    const recent = moment(startDate);
    const rows = await this.db
      .eventsDB('cd_events')
      .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
      .select(this.db.eventsDB.raw('count(*), cd_applications.dojo_id'))
      .whereRaw(`cd_events.created_at > '${recent.format('YYYY-MM-DD')}'`)
      .groupByRaw('cd_applications.dojo_id')
      .havingRaw(`count(*) >= ${count}` || 1);
    if (this.output) {
      await append(
        this.filename,
        `\nCount of Dojos Using Events With at least an attendant since ${startDate}: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
