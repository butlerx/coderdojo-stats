var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');

module.exports = function (startDate) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    var bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    return bases.dojos.activeDojos()
    .then(function (dojos) {
      return Promise.resolve(_.map(dojos, 'id'));
    })
    .then(function (dojoIds) {
      return ctx.db.dojosDB('cd_dojos').distinct('alpha2').whereIn('id', dojoIds);
    })
    .then(function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of active countires:' + rows.length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
