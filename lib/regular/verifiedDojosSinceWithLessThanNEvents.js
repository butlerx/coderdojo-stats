import _ from 'lodash';
import moment from 'moment';
import base from '../bases';
import { log, append } from '../util';

export default async function verifiedDojosSinceWithLessThanNEvents(
  startDate,
  eventCount,
  verifiedAt,
) {
  try {
    const db = this.db;
    const recent = moment(startDate);
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const dojos = await db
      .eventsDB('cd_events')
      .select(db.eventsDB.raw('count(*), cd_events.dojo_id'))
      .groupByRaw('cd_events.dojo_id')
      .whereRaw(`cd_events.created_at > '${recent.format('YYYY-MM-DD')}'`)
      .havingRaw(`count(*) < ${eventCount}` || 1);
    const dojoIds = await db.eventsDB('cd_events').distinct('dojo_id');
    const dojosWithEvents = await db
      .dojosDB('cd_dojos')
      .distinct('id')
      .whereIn('id', _.map(dojos, 'dojo_id'))
      .or.whereNotIn('id', _.map(dojoIds, 'dojo_id'));
    const rows = verifiedAt
      ? bases.dojos.activeDojos(null, verifiedAt).and.whereIn('id', _.map(dojosWithEvents, 'id'))
      : dojosWithEvents;
    if (this.output) {
      await append(
        this.filename,
        `\nCount of Dojos With less than ${eventCount} events since ${startDate} and verified since ${verifiedAt}: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
