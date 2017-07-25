/**
 * [exports description]
 * @param  {Object} dojosDB db connetion
 * @return {[type]}         [description]
 */
module.exports = dojosDB => ({
  //  SELECT  distinct json_object_keys((application->>'dojoListing')::json)  FROM cd_dojoleads WHERE application::text != '{}'; // TODO : dropping this here, for the thrill (dojoListing, championDetails, setupYourDojo)
  /**
   * [usersByType description]
   * @param  {String} fields
   * @param  {String||Array} type
   * @return {Knex}        a built query
   */
  belongingToDojo (fields, users) {
    return dojosDB('cd_usersdojos').select(dojosDB.raw(fields)).whereIn('cd_usersdojos.user_id', users);
  },

  byRoleType (fields, role) {
    return dojosDB('cd_usersdojos')
      .select(dojosDB.raw(fields))
      .whereIn(
        'user_id',
        dojosDB
          .distinct('associations.user_id')
          .from(
            dojosDB('cd_usersdojos').select(dojosDB.raw('unnest(user_types) as user_type, user_id')).as('associations')
          )
          .where('associations.user_type', '=', role)
      );
  },

  byRawRoleType (fields, role) {
    return dojosDB
      .select(dojosDB.raw(fields))
      .from(
        dojosDB('cd_usersdojos').select(dojosDB.raw(`unnest(user_types) as user_type, ${fields}`)).as('associations')
      )
      .where('associations.user_type', '=', role);
  },

  byPermissions (fields, perms) {
    return dojosDB
      .select(dojosDB.raw(fields))
      .from(dojosDB('cd_usersdojos').select(dojosDB.raw('unnest(user_permissions) as perm, *')).as('perms'))
      .whereIn(dojosDB.raw("perm->>'name'"), perms);
  },

  activeDojos (since, verifiedAt) {
    const q = dojosDB('cd_dojos')
      .select('id', 'name')
      .where('verified', '=', 1)
      .andWhere('deleted', '=', 0)
      .andWhere('stage', '!=', 4);
    if (since) q.andWhere('created', '>', since);
    if (verifiedAt) q.andWhere('created', '>', verifiedAt);
    return q;
  },
});
