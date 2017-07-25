import _ from 'lodash';
import base from '../bases';
import { log, append } from '../util';

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType
 * @return {[type]}           [description]
 */
export default async function nbUsersByUserAssociation(role) {
  try {
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const dojos = await bases.dojos.activeDojos();
    const associations = await bases.dojos
      .byRawRoleType('user_id, dojo_id', role)
      .whereIn('dojo_id', _.map(dojos, 'id'));
    const rows = await this.db
      .usersDB('cd_profiles')
      .distinct('user_id')
      .whereIn('user_id', _.map(associations, 'user_id'));
    if (this.output) {
      await append(
        this.filename,
        `\nCount of joined users for ${role} at current date :${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
