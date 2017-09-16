import _ from 'lodash';
import base from '../bases';
import { append } from '../util';

export default async function nbTargetUsingBadges(
  startDate,
  minBadgesForPeriod,
  userTypes,
  excluded,
  target,
) {
  // users w/ badges
  //  with date received > startDate
  // dojo relationship
  // uniq dojos
  try {
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const profiles = await this.db.usersDB
      .from(bases.users.flattenedBadges())
      .select('user_id')
      .whereRaw(`badges.badge->>'created' > '${startDate}'`)
      .or.whereRaw(`badges.badge->>'dateAccepted' > '${startDate}'`)
      .modify(({ and }) => {
        if (userTypes) and.whereIn('user_id', bases.users.usersByType('user_id', userTypes));
      })
      .modify(({ and }) => {
        if (excluded) and.whereNotIn(this.db.usersDB.raw("badges.badge->>'slug'"), excluded);
      })
      .join('cd_profiles as cdp', 'badges.id', 'cdp.id');
    let rows;
    if (target === 'dojos') {
      rows = await this.db
        .dojosDB('cd_usersdojos')
        .select('dojo_id')
        .count('dojo_id')
        .whereIn('user_id', _.map(profiles, 'user_id'))
        .groupBy('dojo_id')
        .havingRaw(`count(dojo_id) > ${minBadgesForPeriod}`);
    } else if (target === 'users' || target === 'badges') {
      rows = await profiles;
    } else {
      throw new Error('Missing parameter in nbDojos');
    }
    if (this.output) {
      let string = '';
      let length = 0;
      if (target === 'dojos') {
        string = `\nCount of dojo who issued at least ${minBadgesForPeriod} badge since ${startDate}`;
        length = _.uniq(_.map(rows, 'dojo_id')).length;
      } else if (target === 'users') {
        string = `\nCount of users with usertype ${userTypes} who were issued badges since ${startDate}`;
        length = _.uniq(_.map(rows, 'user_id')).length;
      } else if (target === 'badges') {
        string = `\nCount of badges who were issued badges since ${startDate} for userTypes ${userTypes}`;
        length = _.map(rows, 'user_id').length;
      } else {
        throw new Error('Missing parameter in nbDojos');
      }
      if (excluded) string += ` with ${excluded.length} badges excluded`;
      await append(this.filename, `${string} : ${length}\n`);
    }
    return rows;
  } catch (err) {
    throw err;
  }
}
