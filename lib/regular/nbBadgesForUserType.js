import moment from 'moment';
import _ from 'lodash';
import base from './../bases';
import { log, append } from '../util';

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType
 * @return {[type]}           [description]
 */
export default async function nbBadgesForUserType(startDate, userType) {
  try {
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const recent = moment(startDate);
    const profiles = await bases.users
      .usersByType('cd_profiles.user_id, cd_profiles.id', userType)
      .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
      .whereRaw(`sys_user.when > '${recent.format('YYYY-MM-DD')}'`)
      .and.whereNotNull('cd_profiles.badges')
      .and.whereRaw("cd_profiles.badges::text != '{}'");
    const rows = await bases.users
      .flattenedBadges()
      .whereIn('cd_profiles.id', _.map(profiles, 'id'));
    if (this.output) {
      await append(
        this.filename,
        `\nCount of badges for ${userType} since ${startDate}: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
