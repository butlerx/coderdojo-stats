const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');

module.exports = (since, partlyFn) => function () {
  console.log(__filename.slice(__dirname.length + 1));

  const ctx = this;
  let partyHardDojos;
  let badgingDojos = [];
  const autoBadges = [
    'my-1st-dojo!',
    'coolest-projects-2016',
    'mentor-badge',
    'champion-badge',
    'attend-25-dojo-sessions!',
    'europe-code-week-2016',
    'attend-10-dojo-sessions!',
    'dojocon-2016',
    'petes-test-badge',
    'attend-5-dojo-sessions!',
    'coderdojo-ethos:-implementation-and-practice',
    'inspiring-ninjas:-how-to-be-a-coderdojo-mentor',
  ];

  const dojosUsingBadges = require('../regular/nbTargetUsingBadges')(since, 1, ['attendee-o13', 'attendee-u13'], partlyFn ? null : autoBadges, 'dojos');
  const dojosUsingEvents = require('../regular/dojosCreatingEventsAndBookedAndCheckedIn')(since, 2);
  return dojosUsingBadges
    .bind(_.omit(ctx, 'output'))()
    .then(dojos => {
      badgingDojos = dojos;
    })
    .then(() => dojosUsingEvents.bind(_.omit(ctx, 'output'))().then(dojos => {
      partyHardDojos = dojos;
    }))
    .then(() => {
      console.log(_.map(partyHardDojos, 'dojo_id'));
      console.log(_.map(badgingDojos, 'dojo_id'));
      return ctx.db
        .dojosDB('cd_dojos')
        .whereIn('id', _.map(partyHardDojos, 'dojo_id'))
        .modify(({ or, and }) => {
          if (partlyFn) {
            return or;
          } else {
            return and;
          }
        })
        .whereIn('id', _.map(badgingDojos, 'dojo_id'));
    })
    .then(rows => {
      console.log(rows.length);
      if (ctx.output) {
        let string = `Count of ${partlyFn ? 'partly' : 'fully'} active dojos : ${rows.length}`;
        if (since) string += ` since ${since}`;
        fs.appendFileSync(ctx.filename, `\n${string}\n`);
      }
      return Promise.resolve(rows);
    });
};
