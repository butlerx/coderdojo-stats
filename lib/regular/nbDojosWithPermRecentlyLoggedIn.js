import _ from 'lodash';
import base from '../bases';
import { log, append } from '../util';

export default async function nbDojosWithPermRecentlyLoggedIn(startDate, perms, isActiveDojo) {
  try {
    // NOTE: Result is frankly fishy
    const bases = base(this.db.usersDB, this.db.dojosDB);
    const usersdojos = await bases.dojos.byPermissions('dojo_id, user_id', perms).as('allowed');
    const logins = await this.db.usersDB
      .from(
        this.db
          .usersDB('sys_login')
          .select('user')
          .join('sys_user', 'sys_user.id', 'sys_login.user')
          .whereRaw("sys_user.roles::text NOT LIKE '%cdf-admin%'")
          .whereIn('user', _.map(usersdojos, 'user_id'))
          .whereRaw(`sys_login.when > '${startDate}'`)
          .as('logins'),
        // .or.where('sys_login.ended', '>', Date.parse(startDate))
      )
      .distinct('logins.user');
    const rows = await bases.dojos
      .byPermissions('distinct dojo_id', perms)
      .whereIn('user_id', _.map(logins, 'user'))
      .modify(async function checkActive() {
        const mod = this;
        if (isActiveDojo) {
          const dojos = await bases.dojos.activeDojos(startDate);
          mod.whereIn('dojo_id', _.map(dojos, 'id'));
        }
        return mod;
      });
    if (this.output) {
      await append(
        this.filename,
        `\nCount of ${isActiveDojo
          ? 'active '
          : ''}dojo who had an admin loggin-in since ${startDate}:${_.uniqBy(rows, 'dojo_id')
          .length}\n`,
      );
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
