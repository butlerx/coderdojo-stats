import _ from 'lodash';
import dojosWithRegularEventsBookedType from '../common/dojosWithRegularEventsBookedType';
import base from '../bases';
import { log, append } from '../util';

export default async function nbVerifiedDojosActivelyUsingTicketingSince(
  verifiedSince,
  lastDateOfPeriod,
  qtyEvents,
  userType,
  qtyUserType,
) {
  try {
    const dojosWithEvents = await dojosWithRegularEventsBookedType(
      lastDateOfPeriod,
      qtyEvents,
      userType,
      qtyUserType,
    );
    // users w/ badges
    //  with date received > startDate
    // dojo relationship
    // uniq dojos
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const dojos = await dojosWithEvents.bind(_.omit(this, 'output'))();
    const activeDojos = await bases.dojos.activeDojos(null, verifiedSince);
    const rows = await this.db
      .dojosDB('cd_dojos')
      .whereIn('id', _.map(activeDojos, 'id'))
      .and.whereIn('id', _.map(dojos, 'dojo_id'));
    if (this.output) {
      append(
        this.filename,
        `\nCount of Dojos Using Events With at least ${qtyUserType} ${userType} who checked in and has been veriified since ${verifiedSince}: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
