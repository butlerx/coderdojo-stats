const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');

module.exports = startDate => function () {
  console.log(__filename.slice(__dirname.length + 1));

  const ctx = this;
  // users w/ badges
  //  with date received > startDate
  // dojo relationship
  // uniq dojos
  const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
  return ctx.db.usersDB
    .from(bases.users.flattenedBadges())
    .select(ctx.db.usersDB.raw("badges.badge->>'slug' as slug, count(badges.badge->>'slug')"))
    .whereRaw(`badges.badge->>'created' > '${startDate}'`)
    .or.whereRaw(`badges.badge->>'dateAccepted' > '${startDate}'`)
    .groupByRaw("badges.badge->>'slug'")
    .orderByRaw("count(badges.badge->>'slug') desc")
    .then(rows => {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, `\nStats of usage per badge since ${startDate}:\n`);
        _.each(rows, ({ slug, count }) => {
          fs.appendFileSync(ctx.filename, `${slug} ; ${count}\n`);
        });
      }
      return Promise.resolve(rows);
    });
};
