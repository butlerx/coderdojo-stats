var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');

module.exports = function (since, partlyFn) {
  return function () {
    console.log(__filename.slice(__dirname.length + 1));

    var ctx = this;
    var partyHardDojos, badgingDojos = [];
    var autoBadges = ['my-1st-dojo!', 'coolest-projects-2016', 'mentor-badge', 'champion-badge', 'attend-25-dojo-sessions!', 'europe-code-week-2016', 'attend-10-dojo-sessions!',
      'dojocon-2016', 'petes-test-badge', 'attend-5-dojo-sessions!', 'coderdojo-ethos:-implementation-and-practice', 'inspiring-ninjas:-how-to-be-a-coderdojo-mentor'];

    var dojosUsingBadges = require('../regular/nbTargetUsingBadges')(since, 1, ['attendee-o13', 'attendee-u13'], partlyFn ? null : autoBadges, 'dojos');
    var dojosUsingEvents = require('../regular/dojosCreatingEventsAndBookedAndCheckedIn')(since, 2);
    return dojosUsingBadges.bind(_.omit(ctx, 'output'))()
    .then(function (dojos) {
      badgingDojos = dojos;
    })
    .then(function () {
      return dojosUsingEvents.bind(_.omit(ctx, 'output'))()
      .then(function (dojos) {
        partyHardDojos = dojos;
      });
    })
    .then(function () {
      console.log(_.map(partyHardDojos, 'dojo_id'));
      console.log(_.map(badgingDojos, 'dojo_id'));
      return ctx.db.dojosDB('cd_dojos')
      .whereIn('id', _.map(partyHardDojos, 'dojo_id'))
      .modify(function (queryBuilder) {
        if (partlyFn) {
          return queryBuilder.or;
        } else {
          return queryBuilder.and;
        }
      })
      .whereIn('id', _.map(badgingDojos, 'dojo_id'));
    })
    .then(function (rows) {
      console.log(rows.length);
      if (ctx.output) {
        var string = 'Count of ' + (partlyFn ? 'partly' : 'fully') + ' active dojos : ' + rows.length;
        if (since) string += ' since ' + since;
        fs.appendFileSync(ctx.filename, '\n' + string + '\n');
      }
      return Promise.resolve(rows);
    });
  };
};
