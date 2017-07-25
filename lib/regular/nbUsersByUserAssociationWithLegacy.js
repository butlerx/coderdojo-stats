import _ from 'lodash';
import base from '../bases';
import { log, append } from '../util';

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType
 * @return {[type]}           [description]
 */
export default async function nbUsersByUserAssociationWithLegacy(role) {
  try {
    const ctx = this;
    const bases = base(ctx.db.usersDB, ctx.db.dojosDB);
    const dojos = await bases.dojos.activeDojos();
    const associations = await bases.dojos
      .byRawRoleType('user_id, dojo_id', role)
      .whereIn('dojo_id', _.map(dojos, 'id'));
    const rows = await ctx.db
      .usersDB('cd_profiles')
      .distinct('user_id')
      .whereIn('user_id', _.map(associations, 'user_id'))
      .or.where('user_type', '=', role);
    if (ctx.output) {
      await append(
        ctx.filename,
        `\nCount of users either joined to a dojo for ${role} or with corresponding old registration usertype at current date :${rows.length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
