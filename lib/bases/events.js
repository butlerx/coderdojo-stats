module.exports = function (eventsDB) {
  return {
    flattenedAttendances: function () {
      // var applications =  eventsDB.raw('SELECT unnest(attendances), cd_applications.id as date FROM cd_applications');
      var applications = eventsDB('cd_applications').select(eventsDB.raw('unnest(attendance) as date, cd_applications.id')).as('attendances');
      return applications;
    },
    flattenedEventDates: function () {
      var applications = eventsDB('cd_events').select(eventsDB.raw('json_array_elements(to_json(dates))::json->>\'startTime\' as startTime, json_array_elements(to_json(dates))::json->>\'endTime\' as endTime, cd_events.id')).as('dates');
      return applications;
    }
  };
};
