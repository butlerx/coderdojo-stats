import _ from 'lodash';

export default async function userChampForVerifiedDojo(userId) {
  try {
    const {
      rows,
    } = await this.dojosClient.query(
      "SELECT dojo_id FROM cd_usersdojos WHERE user_id=$1 AND array_to_string(user_types, ',') LIKE '%champion%'",
      [userId],
    );
    const promises = [];
    rows.forEach(({ dojo_id }) => {
      promises.push(_.bind(dojoVerified, this)(dojo_id));
    });
    const values = await Promise.all(promises);
    return values.includes(true);
  } catch (err) {
    throw err;
  }
}

async function dojoVerified(dojoId) {
  try {
    const { rows } = await this.dojosClient.query('SELECT verified FROM cd_dojos WHERE id=$1', [
      dojoId,
    ]);
    const ver = rows.reduce((acc, { verified }) => acc || verified === 1, false);
    return ver;
  } catch (err) {
    throw err;
  }
}
