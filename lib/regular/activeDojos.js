import base from '../bases';
import { log, append } from '../util';

export default async function activeDojos(since, verifiedSince) {
  try {
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const rows = await bases.dojos.activeDojos(since, verifiedSince);
    if (this.output) {
      const opts = verifiedSince ? `and verified since ${verifiedSince}` : ' ';
      let string = `Count of active dojos ${opts} : ${rows.length}`;
      if (since) string += ` since ${since}`;
      await append(this.filename, `\n${string}\n`);
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
