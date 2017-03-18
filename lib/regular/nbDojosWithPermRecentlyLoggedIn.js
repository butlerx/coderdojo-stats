const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');

module.exports = (startDate, perms, isActiveDojo) => function () {
  console.log(__filename.slice(__dirname.length + 1));

  const ctx = this;
  // NOTE: Result is frankly fishy
  const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
  return bases.dojos
    .byPermissions('dojo_id, user_id', perms)
    .as('allowed')
    .then(usersdojos => {
      console.log(usersdojos.length);
      return ctx.db.usersDB
        .from(
          ctx.db
            .usersDB('sys_login')
            .select('user')
            .join('sys_user', 'sys_user.id', 'sys_login.user')
            .whereRaw("sys_user.roles::text NOT LIKE '%cdf-admin%'")
            .whereIn('user', _.map(usersdojos, 'user_id'))
            .whereRaw(`sys_login.when > '${startDate}'`)
            .as('logins')
          // .or.where('sys_login.ended', '>', Date.parse(startDate))
        )
        .distinct('logins.user');
    })
    .then(logins => {
      console.log(logins.length);
      return bases.dojos.byPermissions('distinct dojo_id', perms).whereIn('user_id', _.map(logins, 'user')).modify(function () {
        const mod = this;
        if (isActiveDojo) {
          return bases.dojos.activeDojos(startDate).then(dojos => mod.whereIn('dojo_id', _.map(dojos, 'id')));
        } else {
          return mod;
        }
      });
    })
    .then(rows => {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, `\nCount of ${isActiveDojo ? 'active ' : ''}dojo who had an admin loggin-in since ${startDate}:${_.uniqBy(rows, 'dojo_id').length}\n`);
      }
      return Promise.resolve(rows);
    });
};
