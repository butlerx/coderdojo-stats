import _ from 'lodash';
import moment from 'moment';
import base from '../bases';
import { log, append } from '../util';

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType
 * @return {[type]}           [description]
 */
export default async function nbUsersByGender(startDate, userType) {
  try {
    const db = this.db;
    const bases = base.js(db.usersDB, db.dojosDB);
    const recent = moment(startDate);
    const rows = await bases.users
      .usersByType('cd_profiles.gender, count(*) as counted', userType)
      .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
      .whereRaw(`sys_user.when > '${recent.format('YYYY-MM-DD')}'`)
      .groupBy('cd_profiles.gender');
    if (this.output) {
      _.each(rows, ({ gender, counted }) => {
        append(
          this.filename,
          `\nCount of users for ${userType} with gender = ${gender} since ${startDate}: ${counted}\n`,
        );
      });
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
