const Promise = require('bluebird');
const fs = require('fs');

module.exports = startDate => function () {
  console.log(__filename.slice(__dirname.length + 1));

  const ctx = this;
  const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
  return bases.users.flattenedBadges().then(rows => {
    if (ctx.output) {
      fs.appendFileSync(ctx.filename, `\nCount of awarded badges:${rows.length}\n`);
    }
    return Promise.resolve(rows);
  });
};
