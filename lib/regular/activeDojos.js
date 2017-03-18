const Promise = require('bluebird');
const fs = require('fs');

module.exports = (since, verifiedSince) => function () {
  console.log(__filename.slice(__dirname.length + 1));

  const ctx = this;
  const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
  return bases.dojos.activeDojos(since, verifiedSince).then(rows => {
    if (ctx.output) {
      const opts = verifiedSince ? `and verified since ${verifiedSince}` : ' ';
      let string = `Count of active dojos ${opts} : ${rows.length}`;
      if (since) string += ` since ${since}`;
      fs.appendFileSync(ctx.filename, `\n${string}\n`);
    }
    return Promise.resolve(rows);
  });
};
