import base from './../bases';
import { log, append } from '../util';

export default async function nbBadges() {
  try {
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const rows = await bases.users.flattenedBadges();
    if (this.output) await append(this.filename, `\nCount of awarded badges:${rows.length}\n`);
    return rows;
  } catch (err) {
    log(err);
  }
}
