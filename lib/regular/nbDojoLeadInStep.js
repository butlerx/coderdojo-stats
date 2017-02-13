var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');

module.exports = function (step) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    return ctx.db.dojosDB('cd_dojoleads')
    .where('current_step', '=', step)
    .then(function (rows) {
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nCount of dojo leads in step ' + step + ':' + rows.length + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
