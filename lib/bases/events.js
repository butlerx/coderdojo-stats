export default eventsDB => ({
  flattenedAttendances() {
    return eventsDB('cd_applications')
      .select(eventsDB.raw('unnest(attendance) as date, cd_applications.id'))
      .as('attendances');
  },

  flattenedEventDates() {
    return eventsDB('cd_events')
      .select(
        eventsDB.raw(
          "json_array_elements(to_json(dates))::json->>'startTime' as startTime, json_array_elements(to_json(dates))::json->>'endTime' as endTime, cd_events.id",
        ),
      )
      .as('dates');
  },
});
