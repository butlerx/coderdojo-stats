import moment from 'moment';
import _ from 'lodash';
import base from '../bases';
import { log, append } from '../util';

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType
 * @return {[type]}           [description]
 */
export default async function nbBadgesForUserAssociation(startDate, role) {
  try {
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const recent = moment(startDate);
    const users = await bases.dojos.byRoleType('user_id', role);
    const rows = await this.db
      .usersDB('cd_profiles')
      .select('cd_profiles.user_id')
      .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
      .whereRaw(`sys_user.when > '${recent.format('YYYY-MM-DD')}'`)
      .and.whereNotNull('cd_profiles.badges')
      .and.whereRaw("cd_profiles.badges::text != '{}'")
      .and.whereIn('cd_profiles.user_id', _.map(users, 'user_id'));
    if (this.output) {
      await append(
        this.filename,
        `\nCount of users with badges being a ${role} since ${startDate}: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
