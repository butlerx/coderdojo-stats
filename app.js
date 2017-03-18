const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const fs = require('fs');
const pg = require('pg');
const json2csv = require('json2csv');

pg.types.setTypeParser(20, 'text', parseInt);

const argv = require('minimist')(process.argv.slice(2));
const usersdb = argv.usersdb || 'cp-users-development';
const dojosdb = argv.dojosdb || 'cp-dojos-development';
const eventsdb = argv.eventsdb || 'cp-events-development';
const user = argv.user || 'platform';
const password = argv.password || 'QdYx3D5y';
const interval = argv.interval || '30';

const date = moment();
const monthAgo = moment().day(-interval);

const userDB = require('knex')({
  client    : 'pg',
  connection: {
    host    : '127.0.0.1',
    user,
    password,
    database: usersdb,
  },
});

const dojosDB = require('knex')({
  client    : 'pg',
  connection: {
    host    : '127.0.0.1',
    user,
    password,
    database: dojosdb,
  },
});

const eventsDB = require('knex')({
  client    : 'pg',
  connection: {
    host    : '127.0.0.1',
    user,
    password,
    database: eventsdb,
  },
});

const usersClient = new pg.Client({
  database: usersdb,
  user,
  password,
});
const dojosClient = new pg.Client({
  database: dojosdb,
  user,
  password,
});
const eventsClient = new pg.Client({
  database: eventsdb,
  user,
  password,
});

// Set up file output
const filename = `${date.format('YYYY-MM-DD')}-stats.txt`;
console.log(filename);
fs.appendFileSync(filename, `${date.format('YYYY-MM-DD')}\n`);
numberUsers()
  .then(getChampionPhonesForPolledDojos())
  .then(getO13EmailsPerCountry('CZ'))
  .then(getO13EmailsPerCountry('NL'))
  .then(getO13EmailsPerCountry('GB'))
  .then(getO13EmailsPerCountry('IE'))
  .then(getO13EmailsPerCountry('US'))
  .then(getO13EmailsPerCountry('FR'))
  .then(getO13EmailsPerCountry('DE'))
  .then(getO13EmailsPerCountry('HU'))
  .then(getO13EmailsPerCountry('IT'))
  .then(getO13EmailsPerCountry('PL'))
  .then(getO13EmailsPerCountry('RO'))
  .then(getO13EmailsPerCountry('ES'))
  .then(getUsersEmailByOldUserType('mentor'))
  .then(getChampionsEmailWithNewsletter('IE'))
  .then(getChampionsEmailWithNewsletter('GB'))
  .then(getChampionsEmailWithNewsletter('US'))
  .then(getChampionsEmailWithNewsletter('IT'))
  .then(getChampionsEmailWithNewsletter('IE'))
  .then(getChampionsEmailWithNewsletter('US'))
  .then(getChampionsEmailWithNewsletter('FR'))
  .then(getChampionsEmailWithNewsletter('DE'))
  .then(getChampionsEmailWithNewsletter('HU'))
  .then(getChampionsEmailWithNewsletter('IT'))
  .then(getChampionsEmailWithNewsletter('PL'))
  .then(getChampionsEmailWithNewsletter('RO'))
  .then(getChampionsEmailWithNewsletter('ES'))
  .then(getChampionsEmailWithNewsletter())
  .then(getEveryNonChampionUsersEmailWithNewsletter)
  .then(activeDojos)
  .then(dojosUsingEvents)
  .then(groupedDojosUsingEvents)
  .then(recentEvents)
  .then(regularEvents)
  .then(newUsers)
  .then(totalUsers)
  .then(averageEventCap)
  .then(NumberOfYouthBookedAndCheckedIn)
  .then(NumberOfYouthBooked)
  .then(NumberOfYouthBookedAtLeastTwice)
  .then(NumberOfYouthBookedAndCheckedInAtLeastTwice)
  .then(NumberOfDojosWithEventsWithAtLeastOneAttendant)
  .then(NumberOfDojosWithEventsWithAtLeastOneAttendantWhoCheckedIn)
  .then(() => {
    console.log('Stats finished');
  });
numberUsers('mentors');
getChampionsEmailFrom('GB');
getDojosFrom(['GB', 'IE']);

// Connect to db and execute
usersClient.connect(err => {
  if (err) throw err;
  dojosClient.connect(err => {
    if (err) throw err;
    eventsClient.connect(err => {
      if (err) throw err;
      activeDojoChampions().then(() => {
        usersClient.end(err => {
          if (err) throw err;
        });
        dojosClient.end(err => {
          if (err) throw err;
        });
        eventsClient.end(err => {
          if (err) throw err;
        });
      });
    });
  });
});

// Functions for stats
function activeDojoChampions (...args) {
  console.log(args.callee.name);
  return new Promise((resolve, reject) => {
    usersClient.query(`SELECT id from sys_user WHERE init_user_type LIKE '%champion%' AND sys_user.when>= now() - interval '${interval} days' AND sys_user.when<= now();`, [], (
      err,
      { rows }
    ) => {
      if (err) throw err;
      const promises = [];
      for (let i = 0; i < rows.length; i++) {
        promises.push(userChampForVerifiedDojo(rows[i].id));
      }
      Promise.all(promises).then(
        values => {
          let usersInVerifiedDojos = 0;
          values.forEach(val => {
            if (val === true) usersInVerifiedDojos++;
          });
          fs.appendFileSync(filename, `\nnew champions with registed dojos: ${usersInVerifiedDojos}\n`);
          resolve();
        },
        reason => {
          reject(reason);
        }
      );
    });
  });
}

function getO13EmailsPerCountry (countryCode) {
  return userDB.select('email', 'name').from('cd_profiles').whereRaw(`user_type::text LIKE '%o13%' AND email IS NOT NULL AND alpha2 ='${countryCode}'`).then(o13Profiles => {
    if (o13Profiles.length > 0) {
      const csv = json2csv({ data: o13Profiles });
      fs.writeFile(`o13From${countryCode}.csv`, csv, err => {
        if (err) throw err;
        console.log('file saved');
        return Promise.resolve();
      });
    } else {
      return Promise.resolve();
    }
  });
}

function getUsersEmailByOldUserType (userType) {
  userDB.select('user_id', 'email', 'name', 'user_type').from('cd_profiles').whereRaw(`user_type LIKE '%${userType}%'`).then(legacyUsers => {
    console.log('legacyUsers', legacyUsers.length);
    return new Promise((resolve, reject) => {
      dojosClient.query(
        'SELECT user_id FROM cd_usersdojos ud INNER JOIN cd_dojos d ON ud.dojo_id = d.id ' +
          " WHERE ( array_to_string(user_types, ',') LIKE '%champion%' OR array_to_string(user_types, ',')  LIKE '%mentor%' )",
        [],
        (err, users) => {
          if (err) throw err;
          if (users && users.rows.length > 0) {
            console.log('users', users.rows.length);
            const filteredUsers = _.filter(legacyUsers, (
                { user_id } // console.log(!_.find(users.rows, {user_id: e.user_id}));
              ) => !_.find(users.rows, { user_id }));
            console.log('filteredUsers1', filteredUsers.length, _.last(filteredUsers));
            return resolve(filteredUsers);
          } else {
            return resolve();
          }
        }
      );
    }).then(filteredUsers => {
      console.log('filteredUsers2', filteredUsers.length);
      if (filteredUsers && filteredUsers.length > 0) {
        const csv = json2csv({ data: filteredUsers });
        fs.writeFile(`legacy${userType}.csv`, csv, err => {
          if (err) throw err;
          console.log('file saved');
        });
      }
      return Promise.resolve();
    });
  });
}

function getChampionsEmailFrom (countryCode) {
  return dojosClient.query(
    'SELECT user_id FROM cd_usersdojos ud INNER JOIN cd_dojos d ON ud.dojo_id = d.id ' +
      " WHERE ( array_to_string(user_types, ',') LIKE '%champion%' OR array_to_string(user_types, ',')  LIKE '%mentor%' ) AND (d.alpha2='GB' OR d.alpha2='IE')",
    [],
    (err, { rows }) => {
      if (err) throw err;
      const champions = _.map(rows, 'user_id');
      console.log(champions);
      userDB.select('email', 'name').from('cd_profiles').whereIn('user_id', champions).then(championsProfiles => {
        console.log(championsProfiles);
        const csv = json2csv({ data: championsProfiles });
        fs
          .writeFile(`championsFrom${countryCode}.csv`, csv, err => {
            if (err) throw err;
            console.log('file saved');
          })
          .then(() => Promise.resolve());
      });
    }
  );
}

function getEveryNonChampionUsersEmailWithNewsletter (...args) {
  console.log(args.callee.name);
  return dojosDB.select('user_id').from('cd_usersdojos').whereRaw("array_to_string(user_types, ',') LIKE '%champion%'").then(res =>
    userDB
      .select('email', 'name', 'init_user_type', 'mailing_list')
      .from('sys_user')
      .whereNotIn('id', _.map(res, 'user_id'))
      .andWhere('mailing_list', 1)
      .andWhereRaw("init_user_type::text NOT LIKE '%attendee%'")
      .then(users => {
        console.log(users.length);
        const csv = json2csv({ data: users });
        return fs.writeFile('usersNewsletter.csv', csv, err => {
          if (err) throw err;
          console.log('file saved');
        });
      }));
}

function getChampionsEmailWithNewsletter (countryCode) {
  console.log(arguments.callee.name);
  let query = 'SELECT user_id FROM cd_usersdojos ud INNER JOIN cd_dojos d ON ud.dojo_id = d.id ' +
    " WHERE ( array_to_string(user_types, ',') LIKE '%champion%' OR array_to_string(user_types, ',')  LIKE '%mentor%' )";
  if (countryCode) query += ` AND alpha2 = '${countryCode}'`; // God this is ugly
  return new Promise((resolve, reject) => {
    dojosClient.query(query, [], function (err, res) {
      console.log(arguments.callee.name, countryCode, err);
      if (res && res.rows.length > 0) {
        console.log(arguments.callee.name, res.rows.length, countryCode);
        const champions = _.map(res.rows, 'user_id');
        console.log(champions.length);
        return userDB.select('email', 'name', 'mailing_list').from('sys_user').whereIn('id', champions).andWhere('mailing_list', 1).then(championsProfiles => {
          const csv = json2csv({ data: championsProfiles });
          fs.writeFile(`champions${countryCode}Newsletter.csv`, csv, err => {
            if (err) throw err;
            console.log('file saved');
            return resolve();
          });
        });
      } else {
        return resolve();
      }
    });
  });
}

function getChampionPhonesForPolledDojos (...args) {
  console.log(args.callee.name);
  return dojosClient.query(
    'SELECT user_id FROM cd_usersdojos ud INNER JOIN cd_dojos d ON ud.dojo_id = d.id ' +
      " WHERE array_to_string(user_types, ',') LIKE '%champion%' AND d.verified = 1 AND d.deleted = 0 and d.stage != 4",
    [],
    (err, { rows }) => {
      if (err) throw err;
      const champions = _.map(rows, 'user_id');
      return userDB.select('phone', 'name').from('cd_profiles').whereIn('user_id', champions).andWhereRaw("phone IS NOT NULL AND phone != ''").then(({ length }) => {
        console.log('count', length);
        return Promise.resolve();
      });
    }
  );
}

function getDojosFrom (countryCodes) {
  console.log(arguments.callee.name);
  return dojosDB.select('email', 'name').from('cd_dojos').whereIn('alpha2', countryCodes).then(dojos => {
    const csv = json2csv({ data: dojos });
    fs.writeFile(`dojosFrom${countryCodes}.csv`, csv, err => {
      if (err) throw err;
      console.log('file saved');
    })
    .then(() => Promise.resolve());
  });
}

function userChampForVerifiedDojo (userId) {
  console.log(arguments.callee.name);
  return new Promise((resolve, reject) => {
    dojosClient.query("SELECT dojo_id FROM cd_usersdojos WHERE user_id=$1 AND array_to_string(user_types, ',') LIKE '%champion%'", [userId], (err, { rows }) => {
      if (err) reject(err);
      const promises = [];
      for (let i = 0; i < rows.length; i++) {
        promises.push(dojoVerified(rows[i].dojo_id));
      }
      Promise.all(promises).then(
        values => {
          resolve(values.indexOf(true) !== -1);
        },
        reason => {
          reject(reason);
        }
      );
    });
  });
}

function dojoVerified (dojoId) {
  return new Promise((resolve, reject) => {
    dojosClient.query('SELECT verified FROM cd_dojos WHERE id=$1', [dojoId], (err, { rows }) => {
      if (err) reject(err);
      let verified = false;
      for (let i = 0; i < rows.length; i++) {
        verified = verified || rows[i].verified === 1;
      }
      resolve(verified);
    });
  });
}

function activeDojos (...args) {
  console.log(args.callee.name);
  return dojosDB('cd_dojos')
    .where({
      verified: 1,
      deleted : 0,
    })
    .whereNot('stage', '4')
    .select('country_name')
    .then(rows => {
      const a = [];
      let prev;
      const res = [];
      for (const i in rows) {
        res.push(rows[i].country_name);
      }
      res.sort();
      for (const i in res) {
        if (res[i] !== prev) {
          a.push({ country: res[i], dojos: 1 });
        } else {
          a[a.length - 1].dojos++;
        }
        prev = res[i];
      }
      fs.appendFileSync(filename, '\nActive Dojos Broken Down by Country\n');
      for (const i in a) {
        fs.appendFileSync(filename, `${a[i].country}: ${a[i].dojos}\n`);
      }
      return Promise.resolve();
    })
    .catch(error => {
      console.error(error);
    });
}

// TODO fix by rewirting in to multiple queries
/* function verifiedDojoChamp() {
  return new Promise(function (resolve, reject) {
    usersClient.query('SELECT email from sys_user where id in(SELECT * from public.dblink(\'dbname=cp-dojos-development port=5432 host=localhost user=postgres password=zyqxau82\', \'select user_id from public.cd_usersdojos join public.cd_dojos on public.cd_usersdojos.dojo_id = public.cd_dojos.id where \"owner\"=1 and public.cd_dojos.verified=1 and public.cd_dojos.stage != 4 and public.cd_dojos.deleted = 0\') as data(user_id CHARACTER VARYING));', [], function (err, res) {
      if (err) throw err;
      fs.appendFileSync(filename, 'All verified dojos and champions in the World: ' +'\n');
      for (var i in res.rows) {
        fs.appendFileSync(filename, util.inspect(res.rows[i]) +'\n');
      }
      resolve();
    }, function (reason) {
      reject(reason);
    });
  });
} */

function numberUsers (type) {
  if (_.isUndefined(type)) {
    return userDB('sys_user')
      .count('*')
      .then(rows => {
        fs.appendFileSync(filename, `\nCount of All Users: ${rows[0].count}\n`);
        return Promise.resolve();
      })
      .catch(error => {
        console.error(error);
      });
  } else {
    return Promise.reject('Unhandled scenario');
  }
}

function dojosUsingEvents () {
  return eventsDB('cd_events')
    .distinct('dojo_id')
    .select()
    .where('created_at', '>', monthAgo.format('YYYY-MM-DD HH:mm:ss'))
    .then(({ length }) => {
      fs.appendFileSync(filename, `\nCount of Dojos Using Events since ${monthAgo.format('YYYY-MM-DD HH:mm')}: ${length}\n`);
      return Promise.resolve();
    })
    .then(() => {
      console.log('dojosUsingEventsFinished');
      return Promise.resolve();
    })
    .catch(error => {
      console.error(error);
    });
}

function NumberOfDojosWithEventsWithAtLeastOneAttendant () {
  return eventsDB('cd_events')
    .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
    .select('cd_applications.dojo_id')
    .groupByRaw('cd_applications.dojo_id')
    .then(({ length }) => {
      fs.appendFileSync(filename, `\nCount of Dojos Using Events With at least an attendant${length}\n`);
      return Promise.resolve();
    })
    .then(() => {
      console.log('eventsWithAtLeastOneAttendant');
      return Promise.resolve();
    })
    .catch(error => {
      console.error(error);
    });
}

function NumberOfDojosWithEventsWithAtLeastOneAttendantWhoCheckedIn () {
  return eventsDB('cd_events')
    .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
    .select('cd_applications.dojo_id')
    .whereRaw('cd_applications.attendance IS NOT NULL')
    .groupByRaw('cd_applications.dojo_id')
    .then(({ length }) => {
      fs.appendFileSync(filename, `\nCount of Dojos Using Events With at least an attendant who checked in${length}\n`);
      return Promise.resolve();
    })
    .then(() => {
      console.log('NumberOfDojosWithEventsWithAtLeastOneAttendantWhoCheckedIn');
      return Promise.resolve();
    })
    .catch(error => {
      console.error(error);
    });
}

function NumberOfYouthBookedAndCheckedIn () {
  return eventsDB('cd_applications')
    .select()
    .where('ticket_type', 'ninja')
    .andWhereRaw(eventsDB.raw('attendance IS NOT NULL'))
    .then(({ length }) => {
      fs.appendFileSync(filename, `\nNumber of Youth booked who checked in${length}\n`);
      return Promise.resolve();
    })
    .then(() => {
      console.log('NumberOfYouthBookedAndCheckedIn');
      return Promise.resolve();
    })
    .catch(error => {
      console.error(error);
    });
}

function NumberOfYouthBooked () {
  return eventsDB('cd_applications')
    .select()
    .where('ticket_type', 'ninja')
    .then(({ length }) => {
      fs.appendFileSync(filename, `\nNumber of Youth booked${length}\n`);
      return Promise.resolve();
    })
    .then(() => {
      console.log('NumberOfYouthBooked');
      return Promise.resolve();
    })
    .catch(error => {
      console.error(error);
    });
}

function NumberOfYouthBookedAtLeastTwice () {
  return eventsDB('cd_applications')
    .count()
    .where('ticket_type', 'ninja')
    .groupByRaw('user_id')
    .havingRaw('count(*) > 1')
    .then(({ length }) => {
      fs.appendFileSync(filename, `\nNumber of Youth booked At least twice${length}\n`);
      return Promise.resolve();
    })
    .then(() => {
      console.log('NumberOfYouthBookedAtLeastTwice');
      return Promise.resolve();
    })
    .catch(error => {
      console.error(error);
    });
}

function NumberOfYouthBookedAndCheckedInAtLeastTwice () {
  console.log(
    eventsDB('cd_profiles')
      .whereIn('user_type', ['attendee-u13', 'attendee-o13'])
      .andWhereRaw(eventsDB.raw('attendance IS NOT NULL'))
      .groupByRaw('user_id')
      .havingRaw('count(*) > 1')
      .toSQL()
  );
  return eventsDB('cd_applications')
    .count()
    .where('ticket_type', 'ninja')
    .andWhereRaw(eventsDB.raw('attendance IS NOT NULL'))
    .groupByRaw('user_id')
    .havingRaw('count(*) > 1')
    .then(({ length }) => {
      fs.appendFileSync(filename, `\nNumber of Youth booked and checked in at least twice${length}\n`);
      return true;
    })
    .then(() => {
      console.log('NumberOfYouthBookedAndCheckedInAtLeastTwice');
      return Promise.resolve();
    })
    .catch(error => {
      console.error(error);
    });
}

function NumberOfYouthBookedAndCheckedInAtLeastTwice () {
  console.log(
    eventsDB('cd_applications').count().where('ticket_type', 'ninja').andWhereRaw(eventsDB.raw('attendance IS NOT NULL')).groupByRaw('user_id').havingRaw('count(*) > 1').toSQL()
  );
  return eventsDB('cd_applications')
    .count()
    .where('ticket_type', 'ninja')
    .andWhereRaw(eventsDB.raw('attendance IS NOT NULL'))
    .groupByRaw('user_id')
    .havingRaw('count(*) > 1')
    .then(({ length }) => {
      fs.appendFileSync(filename, `\nNumber of Youth booked and checked in at least twice${length}\n`);
      return true;
    })
    .then(() => {
      console.log('NumberOfYouthBookedAndCheckedInAtLeastTwice');
      return Promise.resolve();
    })
    .catch(error => {
      console.error(error);
    });
}

function groupedDojosUsingEvents (...args) {
  console.log(args.callee.name);
  fs.appendFileSync(filename, `\nNumber of events per dojos for${monthAgo.format('YYYY-MM-DD HH:mm')}\n`);
  return eventsDB('cd_events')
    .select('dojo_id', eventsDB.raw('COUNT(id) as count'))
    .where('created_at', '>', monthAgo.format('YYYY-MM-DD HH:mm:ss'))
    .groupByRaw('dojo_id HAVING count(id) >= 5')
    .then(rows => {
      Promise.each(rows, ({ dojo_id, count }) => {
        fs.appendFileSync(filename, `\n${dojo_id}: ${count}\n`);
        return Promise.resolve();
      }).then(() => {
        console.log('groupedDojosUsingEventsFinished');
        return Promise.resolve();
      });
    })
    .catch(error => {
      console.error(error);
    });
}

function recentEvents (...args) {
  console.log(args.callee.name);
  return eventsDB('cd_events')
    .select()
    .where('created_at', '>', monthAgo.format('YYYY-MM-DD HH:mm:ss'))
    .then(({ length }) => {
      fs.appendFileSync(filename, `\nTotal Count of Events since ${monthAgo.format('YYYY-MM-DD HH:mm')}: ${length}\n`);
      return true;
    })
    .catch(error => {
      console.error(error);
    });
}

function regularEvents (...args) {
  console.log(args.callee.name);
  const recent = moment().week(-6);
  const recentEvents = [];
  return eventsDB('cd_events')
    .select('dates', 'dojo_id')
    .then(rows => {
      for (const i in rows) {
        for (let j = 0; j < rows[i].dates.length; j++) {
          if (rows[i].dates[j].startTime > recent.format()) {
            recentEvents.push(rows[i].dojo_id);
            j = rows[i].dates.length;
          }
        }
      }
      fs.appendFileSync(filename, `\nDojos Createing events recently (in the last 6 weeks): ${_.uniq(recentEvents).length}\n`);
      return Promise.resolve();
    })
    .catch(error => {
      console.error(error);
    });
}

// if you want fell free to rewrite these theres too many nested for loops possibly reversing the logic would be better
function newUsers (...args) {
  console.log(args.callee.name);
  let o13male = 0;
  let o13female = 0;
  let o13undisclosed = 0;
  let u13undisclosed = 0;
  let u13male = 0;
  let u13female = 0;
  const adults = [];
  const o13 = [];
  const u13 = [];
  return userDB('sys_user')
    .select('init_user_type', 'id')
    .where('when', '>', monthAgo.format('YYYY-MM-DD HH:mm:ss'))
    .then(rows => {
      for (const i in rows) {
        if (_.includes(rows[i].init_user_type, 'attendee-o13')) {
          o13.push(rows[i].id);
        } else if (_.includes(rows[i].init_user_type, 'attendee-u13')) {
          u13.push(rows[i].id);
        } else if (_.includes(rows[i].init_user_type, 'parent-guardian')) {
          adults.push(rows[i].id);
        }
      }
      return userDB('cd_profiles')
        .select('user_id', 'gender')
        .then(rows => {
          for (const i in o13) {
            for (let j = 0; j < rows.length; j++) {
              if (_.includes(rows[j], o13[i]) && _.includes(rows[j], 'Male')) {
                o13male++;
                j = rows.length;
              } else if (_.includes(rows[j], o13[i]) && _.includes(rows[j], 'Female')) {
                o13female++;
                j = rows.length;
              } else if (_.includes(rows[j], o13[i]) && !_.includes(rows[j], 'Male') && !_.includes(rows[j], 'Female')) {
                o13undisclosed++;
                j = rows.length;
              }
            }
          }
          for (const i in u13) {
            for (let j = 0; j < rows.length; j++) {
              if (_.includes(rows[j], u13[i]) && _.includes(rows[j], 'Male')) {
                u13male++;
                j = rows.length;
              } else if (_.includes(rows[j], u13[i]) && _.includes(rows[j], 'Female')) {
                u13female++;
                j = rows.length;
              } else if (_.includes(rows[j], u13[i]) && !_.includes(rows[j], 'Male') && !_.includes(rows[j], 'Female')) {
                u13undisclosed++;
                j = rows.length;
              }
            }
          }
          fs.appendFileSync(filename, `\nNew users in the past ${interval} days\n`);
          fs.appendFileSync(filename, `Ninjas under 13 ${u13.length}\n`);
          fs.appendFileSync(filename, `Male ${u13male}, female ${u13female} Undisclosed ${u13undisclosed}\n`);
          fs.appendFileSync(filename, `Ninjas over 13 ${o13.length}\n`);
          fs.appendFileSync(filename, `Male ${o13male}, female ${o13female} Undisclosed ${o13undisclosed}\n`);
          fs.appendFileSync(filename, `Adults ${adults.length}\n`);
          console.log('that stupid long one is done, i blame the db');
          return Promise.resolve();
        })
        .catch(error => {
          console.error(error);
        });
    })
    .catch(error => {
      console.error(error);
    });
}

function totalUsers (...args) {
  console.log(args.callee.name);
  let o13male = 0;
  let o13female = 0;
  let o13undisclosed = 0;
  let u13undisclosed = 0;
  let u13male = 0;
  let u13female = 0;
  const adults = [];
  const o13 = [];
  const u13 = [];
  return userDB('sys_user')
    .select('init_user_type', 'id')
    .then(rows => {
      for (const i in rows) {
        if (_.includes(rows[i].init_user_type, 'attendee-o13')) {
          o13.push(rows[i].id);
        } else if (_.includes(rows[i].init_user_type, 'attendee-u13')) {
          u13.push(rows[i].id);
        } else if (!_.includes(rows[i].init_user_type, 'attendee-u13') && !_.includes(rows[i].init_user_type, 'attendee-o13')) {
          adults.push(rows[i].id);
        }
      }
      return userDB('cd_profiles')
        .select('user_id', 'gender')
        .then(rows => {
          for (const i in o13) {
            for (let j = 0; j < rows.length; j++) {
              if (_.includes(rows[j], o13[i]) && _.includes(rows[j], 'Male')) {
                o13male++;
                j = rows.length;
              } else if (_.includes(rows[j], o13[i]) && _.includes(rows[j], 'Female')) {
                o13female++;
                j = rows.length;
              } else if (_.includes(rows[j], o13[i]) && !_.includes(rows[j], 'Male') && !_.includes(rows[j], 'Female')) {
                o13undisclosed++;
                j = rows.length;
              }
            }
          }
          for (const i in u13) {
            for (let j = 0; j < rows.length; j++) {
              if (_.includes(rows[j], u13[i]) && _.includes(rows[j], 'Male')) {
                u13male++;
                j = rows.length;
              } else if (_.includes(rows[j], u13[i]) && _.includes(rows[j], 'Female')) {
                u13female++;
                j = rows.length;
              } else if (_.includes(rows[j], u13[i]) && !_.includes(rows[j], 'Male') && !_.includes(rows[j], 'Female')) {
                u13undisclosed++;
                j = rows.length;
              }
            }
          }
          fs.appendFileSync(filename, '\nTotal users\n');
          fs.appendFileSync(filename, `Ninjas under 13 ${u13.length}\n`);
          fs.appendFileSync(filename, `Male ${u13male}, female ${u13female}, Undisclosed ${u13undisclosed}\n`);
          fs.appendFileSync(filename, `Ninjas over 13 ${o13.length}\n`);
          fs.appendFileSync(filename, `Male ${o13male} female ${o13female}, Undisclosed ${o13undisclosed}\n`);
          fs.appendFileSync(filename, `Adults ${adults.length}\n`);
          console.log('that other stupid long one is done, i blame the db');
          return Promise.resolve();
        })
        .catch(error => {
          console.error(error);
        });
    })
    .catch(error => {
      console.error(error);
    });
}

function averageEventCap (...args) {
  console.log(args.callee.name);
  return eventsDB('cd_events')
    .join('cd_applications', 'cd_events.id', 'cd_applications.event_id')
    .select('cd_applications.session_id', 'cd_events.id', 'cd_events.name', 'cd_applications.attendance', 'cd_events.dojo_id')
    .where('created_at', '>', monthAgo.format('YYYY-MM-DD HH:mm:ss'))
    .then(rows => {
      let prev;
      let res = [];
      rows = sortByKey(rows, 'session_id');
      for (const i in rows) {
        if (_.isUndefined(prev)) {
          if (_.isEmpty(rows[i].attendance)) {
            res.push({ name: rows[i].name, tickets: 1, checkin: 0, session_id: rows[i].session_id, dojo_id: rows[i].dojo_id, id: rows[i].id });
          } else {
            res.push({ name: rows[i].name, tickets: 1, checkin: 1, session_id: rows[i].session_id, dojo_id: rows[i].dojo_id, id: rows[i].id });
          }
        } else if (rows[i].session_id !== prev.session_id) {
          if (_.isEmpty(rows[i].attendance)) {
            res.push({ name: rows[i].name, tickets: 1, checkin: 0, session_id: rows[i].session_id, dojo_id: rows[i].dojo_id, id: rows[i].id });
          } else {
            res.push({ name: rows[i].name, tickets: 1, checkin: 1, session_id: rows[i].session_id, dojo_id: rows[i].dojo_id, id: rows[i].id });
          }
        } else {
          if (_.isEmpty(rows[i].attendance)) {
            res[res.length - 1].tickets++;
          } else {
            res[res.length - 1].tickets++;
            res[res.length - 1].checkin++;
          }
        }
        prev = rows[i];
      }
      res = sortByKey(res, 'id');
      const events = [];
      return eventsDB('cd_tickets').select('quantity', 'session_id').then(rows => {
        console.log('checking tickets');
        for (const i in res) {
          if (res[i].id !== prev.id) {
            for (let j = 0; j < rows.length; j++) {
              if (res[i].session_id === rows[j].session_id) {
                events.push({ name: res[i].name, tickets: res[i].tickets, checkin: res[i].checkin, quantity: rows[j].quantity });
                j = rows.length;
              }
            }
          } else {
            for (let j = 0; j < rows.length; j++) {
              if (res[i].session_id === rows[j].session_id) {
                events[events.length - 1].tickets += res[i].tickets;
                events[events.length - 1].checkin += res[i].checkin;
                events[events.length - 1].quantity += rows[j].checkin;
                j = rows.length;
              }
            }
          }
        }
        fs.appendFileSync(filename, '\nTickets Sold\n');
        for (const i in events) {
          fs.appendFileSync(filename, `${events[i].name}, tickets Sold: ${events[i].tickets}, checkins: ${events[i].checkin}, tickets available: ${events[i].quantity}\n`);
        }
        console.log('written');
        return Promise.resolve();
      });
    })
    .catch(error => {
      console.error(error);
    });
}

function sortByKey (array, key) {
  return array.sort((a, b) => {
    const x = a[key];
    const y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}
