const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');

module.exports = (verifiedSince, lastDateOfPeriod, qtyEvents, userType, qtyUserType) => function () {
  console.log(__filename.slice(__dirname.length + 1));
  const dojosWithRegularEventsBookedType = require('../common/dojosWithRegularEventsBookedType')(lastDateOfPeriod, qtyEvents, userType, qtyUserType);
  const ctx = this;
  // users w/ badges
  //  with date received > startDate
  // dojo relationship
  // uniq dojos
  const bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
  return dojosWithRegularEventsBookedType
    .bind(_.omit(ctx, 'output'))()
    .then(dojos =>
      bases.dojos
        .activeDojos(null, verifiedSince)
        .then(activeDojos => ctx.db.dojosDB('cd_dojos').whereIn('id', _.map(activeDojos, 'id')).and.whereIn('id', _.map(dojos, 'dojo_id'))))
    .then(rows => {
      if (ctx.output) {
        fs.appendFileSync(
          ctx.filename,
          `\nCount of Dojos Using Events With at least ${qtyUserType} ${userType} who checked in and has been veriified since ${verifiedSince}: ${rows.length}\n`
        );
      }
      return Promise.resolve(rows);
    });
};
