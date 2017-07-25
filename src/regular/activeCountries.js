const _ = require('lodash');
const fs = require('fs');

module.exports = startDate =>
  function () {
    console.log(__filename.slice(__dirname.length + 1));

    const ctx = this;
    const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    return bases.dojos
      .activeDojos()
      .then(dojos => Promise.resolve(_.map(dojos, 'id')))
      .then(dojoIds => ctx.db.dojosDB('cd_dojos').distinct('alpha2').whereIn('id', dojoIds))
      .then(rows => {
        if (ctx.output) {
          fs.appendFileSync(ctx.filename, `\nCount of active countires:${rows.length}\n`);
        }
        return Promise.resolve(rows);
      });
  };
