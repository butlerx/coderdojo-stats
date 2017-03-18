/**
 * [exports description]
 * @param  {Object} usersDB db connetion
 * @return {[type]}         [description]
 */
module.exports = usersDB => ({
  /**
   * [usersByType description]
   * @param  {String} fields
   * @param  {String||Array} type
   * @return {Knex}        a built query
   */
  usersByType (fields, type) {
    if (typeof type === 'string') {
      return usersDB('cd_profiles').select(usersDB.raw(fields)).where('user_type', '=', type);
    } else {
      // assume it's an array
      return usersDB('cd_profiles').select(usersDB.raw(fields)).whereIn('user_type', type);
    }
  },

  flattenedBadges () {
    return usersDB('cd_profiles').select(usersDB.raw('unnest(badges) as badge, cd_profiles.id')).as('badges');
  },
});
