import moment from 'moment';
import base from '../bases';
import { log, append } from '../util';

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType
 * @return {[type]}           [description]
 */
export default async function nbUsersByType(startDate, userType) {
  try {
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const recent = moment(startDate);
    const rows = await bases.users
      .usersByType('cd_profiles.user_id', userType)
      .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
      .whereRaw(`sys_user.when > '${recent.format('YYYY-MM-DD')}'`);
    if (this.output) {
      await append(
        this.filename,
        `\nCount of users for ${userType} since ${startDate}: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
