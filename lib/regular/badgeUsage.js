import _ from 'lodash';
import base from '../bases';
import { log, append } from '../util';

export default async function badgeUsage(startDate) {
  // users w/ badges
  //  with date received > startDate
  // dojo relationship
  // uniq dojos
  try {
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const rows = await this.db.usersDB
      .from(bases.users.flattenedBadges())
      .select(this.db.usersDB.raw("badges.badge->>'slug' as slug, count(badges.badge->>'slug')"))
      .whereRaw(`badges.badge->>'created' > '${startDate}'`)
      .or.whereRaw(`badges.badge->>'dateAccepted' > '${startDate}'`)
      .groupByRaw("badges.badge->>'slug'")
      .orderByRaw("count(badges.badge->>'slug') desc");
    if (this.output) {
      let message = `\nStats of usage per badge since ${startDate}:\n`;
      _.each(rows, ({ slug, count }) => {
        message += `${slug} ; ${count}\n`;
      });
      await append(this.filename, message);
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
