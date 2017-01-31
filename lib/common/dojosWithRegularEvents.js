var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');
var json2csv = require('json2csv');


module.exports = function (lastDateOfPeriod, qtyEvents) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));
    var ctx = this;
    var db = ctx.db;
    var recent = moment(lastDateOfPeriod).month(3), dojoIds = {} ;
    return db.eventsDB('cd_events').select('dates', 'dojo_id').then( function (rows) {
      for( var i in rows) {
        for(var j = 0; j < rows[i].dates.length; j++) {
          if (rows[i].dates[j].startTime > recent.format()) {
            if (dojoIds[rows[i].dojo_id]) {
              dojoIds[rows[i].dojo_id] += 1;
            } else {
              dojoIds[rows[i].dojo_id] = 1;
            }
            j = rows[i].dates.length;
          }
        }
      }
      var validDojosIds = _.pickBy(dojoIds, function (qty) {
        return qty >= qtyEvents;
      });
      if (ctx.output) {
        fs.appendFileSync(ctx.filename, '\nDojos Createing at least ' + qtyEvents + ' events recently (since ' + lastDateOfPeriod + ' for 3 months): ' + _.keys(validDojosIds).length + '\n');
      }
      return Promise.resolve(_.keys(validDojosIds));
    });
  };
};
