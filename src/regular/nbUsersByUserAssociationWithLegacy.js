const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');

/**
 * [exports description]
 * @param  {[type]} startDate [description]
 * @param  {[type]} userType
 * @return {[type]}           [description]
 */
module.exports = role =>
  function () {
    console.log(__filename.slice(__dirname.length + 1));

    const ctx = this;
    const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    return bases.dojos
      .activeDojos()
      .then(dojos => bases.dojos.byRawRoleType('user_id, dojo_id', role).whereIn('dojo_id', _.map(dojos, 'id')))
      .then(associations =>
        ctx.db
          .usersDB('cd_profiles')
          .distinct('user_id')
          .whereIn('user_id', _.map(associations, 'user_id'))
          .or.where('user_type', '=', role)
      )
      .then(rows => {
        if (ctx.output) {
          fs.appendFileSync(
            ctx.filename,
            `\nCount of users either joined to a dojo for ${role} or with corresponding old registration usertype at current date :${rows.length}\n`
          );
        }
        return Promise.resolve(rows);
      });
  };
