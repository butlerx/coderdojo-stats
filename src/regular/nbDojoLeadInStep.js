const Promise = require('bluebird');
const fs = require('fs');

module.exports = step =>
  function () {
    console.log(__filename.slice(__dirname.length + 1));

    const ctx = this;
    return ctx.db.dojosDB('cd_dojoleads').where('current_step', '=', step).then(rows => {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, `\nCount of dojo leads in step ${step}:${rows.length}\n`);
      }
      return Promise.resolve(rows);
    });
  };
