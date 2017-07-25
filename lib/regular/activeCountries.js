import _ from 'lodash';
import base from '../bases';
import { log, append } from '../util';

export default async function activeCountries() {
  try {
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const dojos = await bases.dojos.activeDojos();
    const dojoIds = _.map(dojos, 'id');
    const rows = await this.db.dojosDB('cd_dojos').distinct('alpha2').whereIn('id', dojoIds);
    if (this.output) await append(this.filename, `\nCount of active countires:${rows.length}\n`);
    return rows;
  } catch (err) {
    log(err);
  }
}
