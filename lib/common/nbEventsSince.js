var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');
var json2csv = require('json2csv');

module.exports = function () {
  console.log(__filename.slice(__dirname.length + 1));
  var ctx = this;
  var db = ctx.db;
  return db.eventsDB('cd_events').select().where('created_at', '>', ctx.monthAgo.format("YYYY-MM-DD HH:mm:ss"))
  .then( function (rows) {
    if (ctx.output) {
      fs.appendFileSync(ctx.filename, '\nTotal Count of Events since ' + ctx.monthAgo.format("YYYY-MM-DD HH:mm") + ': ' + rows.length + '\n');
    }
    return Promise.resolve(rows);
  }).catch(function(error) {
    console.error(error);
  });
};
