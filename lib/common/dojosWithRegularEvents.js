import _ from 'lodash';
import moment from 'moment';
import { log, append } from '../util';

export default async function dojosWithRegularEvents(lastDateOfPeriod, qtyEvents) {
  const db = this.db;
  const recent = moment(lastDateOfPeriod).month(3);
  const dojoIds = {};
  try {
    const rows = db.eventsDB('cd_events').select('dates', 'dojo_id');
    rows.forEach(({ dates, dojo_id }) => {
      dates.some(({ startTime }) => {
        if (startTime > recent.format()) {
          if (dojoIds[dojo_id]) {
            dojoIds[dojo_id] += 1;
            return startTime > recent.format();
          }
          dojoIds[dojo_id] = 1;
        }
        return startTime > recent.format();
      });
    });
    const validDojosIds = _.pickBy(dojoIds, qty => qty >= qtyEvents);
    if (this.output) {
      await append(
        this.filename,
        `\nDojos Createing at least ${qtyEvents} events recently (since ${lastDateOfPeriod} for 3 months): ${_.keys(
          validDojosIds,
        ).length}\n`,
      );
    }
    return _.keys(validDojosIds);
  } catch (err) {
    log(err);
  }
}
