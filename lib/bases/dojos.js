/**
 * [exports description]
 * @param  {Object} dojosDB db connetion
 * @return {[type]}         [description]
 */
module.exports = function (dojosDB) {
  return {
    /**
     * [usersByType description]
     * @param  {String} fields
     * @param  {String||Array} type
     * @return {Knex}        a built query
     */
    belongingToDojo: function (fields, users) {
      return dojosDB('cd_usersdojos')
      .select(dojosDB.raw(fields))
      .whereIn('cd_usersdojos.user_id', users);
    }
  };
};
