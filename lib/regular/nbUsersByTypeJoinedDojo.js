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
export default async function nbUsersByTypeJoinedDojo(startDate, userType) {
  try {
    const ctx = this;
    const bases = base(ctx.db.usersDB, ctx.db.dojosDB);
    const recent = moment(startDate);
    const associations = await ctx.db.dojosDB('cd_usersdojos');
    const rows = await bases.users
      .usersByType('cd_profiles.user_id', userType)
      .join('sys_user', 'sys_user.id', 'cd_profiles.user_id')
      .whereRaw(`sys_user.when > '${recent.format('YYYY-MM-DD')}'`)
      .whereIn('user_id', _.map(associations, 'user_id'));
    if (ctx.output) {
      await append(
        ctx.filename,
        `\nCount of joined users for ${userType} since ${startDate}: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
