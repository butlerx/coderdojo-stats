var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');

module.exports = function (since) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    var bases = require('./../bases/index.js')(ctx.db.usersDB, ctx.db.dojosDB);
    return bases.dojos.activeDojos(since)
    .then(function (rows) {
      if (ctx.output) {
        var string = 'Count of active dojos : ' + rows.length;
        if (since) string += ' since ' + since;
        fs.appendFileSync(ctx.filename, '\n' + string + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
