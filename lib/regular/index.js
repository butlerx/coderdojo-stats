var moment = require('moment');
module.exports = function () {
  var exported = {};
  exported.eventsSince = require('../common/nbEventsSince');
  exported.dojosWithRegularEvents = require('../common/dojosWithRegularEvents')('2016-12-15', 3);
  exported.dojosWithRegularEventsBookedType = require('../common/dojosWithRegularEventsBookedType')('2016-12-15', 3, 'ninja', 2);
  exported.dojosCreatingEventsAndBooked = require('../regular/dojosCreatingEventsAndBooked')('2017-01-01');
  exported.dojosCreatingEventsAndBookedAndCheckedIn = require('../regular/dojosCreatingEventsAndBookedAndCheckedIn')('2017-01-01');

  exported.nbUserTypeTicketsBooked = require('../regular/nbUserTypeTicketsBooked')('2015-01-01', 'ninja');
  exported.nbUserTypeTicketsChecked = require('../regular/nbUserTypeTicketsChecked')('2015-01-01', 'ninja');
  // // TODO : dynamic month ?
  exported.nbUserTypeTicketsBookedLastMonth = require('../regular/nbUserTypeTicketsBooked')('2017-01-01', 'ninja', 0);
  exported.nbUserTypeTicketsCheckedLastMonth = require('../regular/nbUserTypeTicketsChecked')('2017-01-01', 'ninja', 0);
  exported.nbUserTypeTicketsBookedTwice = require('../regular/nbUserTypeTicketsBooked')('2015-01-01', 'ninja', 1);
  exported.nbUserTypeTicketsCheckedTwice = require('../regular/nbUserTypeTicketsChecked')('2015-01-01', 'ninja', 1);
  //
  exported.nbU13 = require('../regular/nbUsersByType')('2015-01-01', 'attendee-u13');
  exported.nbO13 = require('../regular/nbUsersByType')('2015-01-01', 'attendee-o13');
  exported.nbO13Gender = require('../regular/nbUsersByGender')('2015-01-01', 'attendee-o13');
  exported.nbYouth = require('../regular/nbUsersByType')('2015-01-01', ['attendee-u13', 'attendee-o13']);
  exported.nbU13JoinedDojo = require('../regular/nbUsersByTypeJoinedDojo')('2015-01-01', 'attendee-u13');
  exported.nbO13JoinedDojo = require('../regular/nbUsersByTypeJoinedDojo')('2015-01-01', 'attendee-o13');
  exported.nbYouthJoinedDojo = require('../regular/nbUsersByTypeJoinedDojo')('2015-01-01', ['attendee-u13', 'attendee-o13']);
  return exported;
};
