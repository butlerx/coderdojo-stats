import _ from 'lodash';
import { log, append } from '../util';
import dojosCreatingEventsAndBookedAndCheckedIn from './dojosCreatingEventsAndBookedAndCheckedIn';
import nbTargetUsingBadges from './nbTargetUsingBadges';

export default async function nbDojoActive(since, partlyFn) {
  try {
    const autoBadges = [
      'my-1st-dojo!',
      'coolest-projects-2016',
      'mentor-badge',
      'champion-badge',
      'attend-25-dojo-sessions!',
      'europe-code-week-2016',
      'attend-10-dojo-sessions!',
      'dojocon-2016',
      'petes-test-badge',
      'attend-5-dojo-sessions!',
      'coderdojo-ethos:-implementation-and-practice',
      'inspiring-ninjas:-how-to-be-a-coderdojo-mentor',
    ];

    const dojosUsingBadges = nbTargetUsingBadges(
      since,
      1,
      ['attendee-o13', 'attendee-u13'],
      partlyFn ? null : autoBadges,
      'dojos',
    );
    const dojosUsingEvents = await dojosCreatingEventsAndBookedAndCheckedIn(since, 2);
    const badgingDojos = await dojosUsingBadges.bind(_.omit(this, 'output'))();
    const partyHardDojos = await dojosUsingEvents.bind(_.omit(this, 'output'))();
    const rows = await this.db
      .dojosDB('cd_dojos')
      .whereIn('id', _.map(partyHardDojos, 'dojo_id'))
      .modify(({ or, and }) => (partlyFn ? or : and))
      .whereIn('id', _.map(badgingDojos, 'dojo_id'));
    if (this.output) {
      let string = `Count of ${partlyFn ? 'partly' : 'fully'} active dojos : ${rows.length}`;
      if (since) string += ` since ${since}`;
      await append(this.filename, `\n${string}\n`);
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
