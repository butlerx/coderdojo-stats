var moment = require('moment');
// NOTE: dates are not dynamic, please adapt if necessary (ie last 30 days ?)
module.exports = function () {
  var exported = {};
  exported.eventsSince = require('../common/nbEventsSince');
  exported.dojosWithRegularEvents = require('../common/dojosWithRegularEvents')('2016-12-15', 3);
  exported.dojosWithRegularEventsBookedType = require('../common/dojosWithRegularEventsBookedType')('2016-12-15', 3, 'ninja', 2);
  exported.dojosCreatingEventsAndBooked = require('../regular/dojosCreatingEventsAndBooked')('2017-01-01');
  exported.dojosCreatingEventsAndBookedAndCheckedIn = require('../regular/dojosCreatingEventsAndBookedAndCheckedIn')('2017-01-01');

  exported.nbUserTypeTicketsBooked = require('../regular/nbUserTypeTicketsBooked')('2015-01-01', 'ninja');
  exported.nbUserTypeTicketsChecked = require('../regular/nbUserTypeTicketsChecked')('2015-01-01', 'ninja');
  // // // TODO : dynamic month ?
  exported.nbUserTypeTicketsBookedLastMonth = require('../regular/nbUserTypeTicketsBooked')('2017-01-01', 'ninja', 0);
  exported.nbUserTypeTicketsCheckedLastMonth = require('../regular/nbUserTypeTicketsChecked')('2017-01-01', 'ninja', 0);
  exported.nbUserTypeTicketsBookedTwice = require('../regular/nbUserTypeTicketsBooked')('2015-01-01', 'ninja', 1);
  exported.nbUserTypeTicketsCheckedTwice = require('../regular/nbUserTypeTicketsChecked')('2015-01-01', 'ninja', 1);
  // //
  exported.nbU13 = require('../regular/nbUsersByType')('2015-01-01', 'attendee-u13');
  exported.nbO13 = require('../regular/nbUsersByType')('2015-01-01', 'attendee-o13');
  exported.nbO13Gender = require('../regular/nbUsersByGender')('2015-01-01', 'attendee-o13');
  exported.nbYouth = require('../regular/nbUsersByType')('2015-01-01', ['attendee-u13', 'attendee-o13']);
  exported.nbU13JoinedDojo = require('../regular/nbUsersByTypeJoinedDojo')('2015-01-01', 'attendee-u13');
  exported.nbO13JoinedDojo = require('../regular/nbUsersByTypeJoinedDojo')('2015-01-01', 'attendee-o13');
  exported.nbYouthJoinedDojo = require('../regular/nbUsersByTypeJoinedDojo')('2015-01-01', ['attendee-u13', 'attendee-o13']);

  // C&C
  exported.activeDojos = require('../regular/activeDojos')();
  exported.activeCountries = require('../regular/activeCountries')();
  exported.nbYouthWithBadges = require('../regular/nbUsersByTypeWithBadges')('2015-01-01', ['attendee-u13', 'attendee-o13']);
  exported.nbBadgesForYouth = require('../regular/nbBadgesForUserType')('2015-01-01', ['attendee-u13', 'attendee-o13']);
  exported.nbBadgesForMentor = require('../regular/nbBadgesForUserAssociation')('2015-01-01', 'mentor');
  exported.nbBadgesForAdults = require('../regular/nbBadgesForUserType')('2015-01-01', ['champion', 'parent-guardian', 'mentor']);
  exported.nbBadges = require('../regular/nbBadges')();
  exported.nbChampions = require('../regular/nbUsersByUserAssociation')('champion');
  exported.nbMentor = require('../regular/nbUsersByUserAssociation')('mentor'); // New role
  // irrelevant
  // exported.nbMentorByUserType = require('../regular/nbUsersByUserAssociationWithLegacy')('mentor'); // New role + old userType (even if old is not linked to a dojo)

  exported.nbParents = require('../regular/nbUsersByUserAssociation')('parent-guardian');
  exported.nbAdults = require('../regular/nbUsersByType')('2015-01-01', ['champion', 'parent-guardian', 'mentor']);
  exported.nbAdultsJoinedDojo = require('../regular/nbUsersByTypeJoinedDojo')('2015-01-01', ['champion', 'parent-guardian', 'mentor']);

  exported.nbDojoLeadInStep2 = require('../regular/nbDojoLeadInStep')(2);
  exported.nbDojoLeadInStep3 = require('../regular/nbDojoLeadInStep')(3);
  exported.nbDojoLeadInStep4 = require('../regular/nbDojoLeadInStep')(4);
  exported.nbDojoLeadInStep5 = require('../regular/nbDojoLeadInStep')(5);

  exported.activeDojosSince = require('../regular/activeDojos')('2017-01-01');
  return exported;
};
