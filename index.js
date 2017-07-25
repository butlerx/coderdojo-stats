#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const fs = require('fs');
const json2csv = require('json2csv');
const program = require('commander');

program
  .version('0.0.1')
  .usage('[options]')
  .option('--get-stats', 'Output stats to file')
  .option(
    '--get-reg-stats',
    'Output regular stats to file from https://docs.google.com/document/d/1Vh9WTRlmpT8WYcLRo05vGsFyy9XzFE3mzKvaVZXMI0M/edit'
  )
  .option('--interval', 'Amount of previous days to gather stats for')
  .option('--get-champions', 'Output champions emails signed up to mailing list to file')
  .option('--get-mentors', 'Output mentors emails signed up to mailing list to file')
  .option('--get-parents', 'Output parents emails signed up to mailing list to file')
  .option('--get-o13s', 'Output O13s emails signed up to mailing list to file')
  .option('--get-dojos', 'Output all dojo and champion emails to file')
  .option('--include-non-dojo-members', 'Include emails of those not a member of a dojo in email dump')
  .option('--countries <items>', 'Comma separated list of country alpha2 codes', val => val.split(','))
  .option('--excluded-countries <items>', 'Comma separated list of country alpha2 codes to be excluded', val =>
    val.split(',')
  )
  .option('--address <address>', 'A partial address to match across the address and city fields')
  .option('--usersdb', 'Database name for users database')
  .option('--dojosdb', 'Database name for dojos database')
  .option('--eventsdb', 'Database name for events database')
  .option('--eventsdb', 'Database name for events database')
  .option('--user', 'Database user')
  .option('--password', 'Database password')
  .parse(process.argv);

const usersdb = program.usersdb || 'cp-users-development';
const dojosdb = program.dojosdb || 'cp-dojos-development';
const eventsdb = program.eventsdb || 'cp-events-development';
const user = program.user || 'platform';
const password = program.password || 'QdYx3D5y';
const interval = program.interval || '30';
const getStats = program.getStats || false;
const getRegularStats = program.getRegStats || false;
const getChampions = program.getChampions || false;
const getMentors = program.getMentors || false;
const getParents = program.getParents || false;
const getO13s = program.getO13s || false;
const getDojos = program.getDojos || false;
const includeNonDojoMembers = program.includeNonDojoMembers || false;
const countries = program.countries || [];
const excludedCountries = program.excludedCountries || [];
const pgCD = require('./connection')(user, password, {
  usersdb,
  eventsdb,
  dojosdb,
});
const usersDB = pgCD.usersDB;
const eventsDB = pgCD.eventsDB;
const dojosDB = pgCD.dojosDB;
const usersClient = pgCD.usersClient;
const eventsClient = pgCD.eventsClient;
const dojosClient = pgCD.dojosClient;

if (!getStats && !getRegularStats && !getChampions && !getMentors && !getParents && !getO13s && !getDojos) {
  program.outputHelp();
  process.exit(1);
}

const date = moment();
const monthAgo = moment().day(-interval);

// Set up file output
const filename = `${date.format('YYYY-MM-DD')}-stats.txt`;
// var countries = ['AU', 'BE', 'NL', 'RO', 'DE', 'ES', 'SE', 'FR'];
let promiseChain = Promise.resolve();
promiseChain = promiseChain.then(connectToClient(usersClient));
promiseChain = promiseChain.then(connectToClient(dojosClient));
promiseChain = promiseChain.then(connectToClient(eventsClient));
if (getChampions) {
  if (countries.length > 0) {
    countries.forEach(country => {
      promiseChain = promiseChain.then(getChampionsEmailWithNewsletter(country));
    });
  } else {
    promiseChain = promiseChain.then(getChampionsEmailWithNewsletter(null, excludedCountries));
  }
}
if (getO13s) {
  if (countries.length > 0) {
    countries.forEach(country => {
      promiseChain = promiseChain.then(getO13sEmailWithNewsletter(country));
    });
  } else {
    promiseChain = promiseChain.then(getO13sEmailWithNewsletter(null, excludedCountries));
  }
}
if (getMentors) {
  if (countries.length > 0) {
    countries.forEach(country => {
      promiseChain = promiseChain.then(getMentorsEmailWithNewsletter(country));
    });
  } else {
    promiseChain = promiseChain.then(getMentorsEmailWithNewsletter(null, excludedCountries));
  }
}
if (getParents) {
  if (countries.length > 0) {
    countries.forEach(country => {
      promiseChain = promiseChain.then(getParentsEmailWithNewsletter(country));
    });
  } else {
    promiseChain = promiseChain.then(getParentsEmailWithNewsletter(null, excludedCountries));
  }
}
if (getDojos) {
  if (countries.length > 0) {
    countries.forEach(country => {
      promiseChain = promiseChain.then(getDojoAndChampionEmails(country));
    });
  } else {
    promiseChain = promiseChain.then(getDojoAndChampionEmails(null, excludedCountries));
  }
}

if (getStats) {
  console.log(`Creating ${filename}`);
  fs.appendFileSync(filename, `${date.format('YYYY-MM-DD')}\n`);
  promiseChain = promiseChain
    .then(activeDojos)
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
    .then(NumberOfDojosWithEventsWithAtLeastOneAttendantWhoCheckedIn);
}

console.log('getRegularStats', getRegularStats);
if (getRegularStats) {
  console.log(`Creating ${filename}`);
  const ctx = {
    // Config
    db    : pgCD,
    monthAgo,
    filename,
    output: true, // Means those one get exported to file, default false to allow chaining of stats
  };
  fs.appendFileSync(filename, `${date.format('YYYY-MM-DD')}\n`);
  const regularsStats = require('./lib/regular')();
  _.each(_.keys(regularsStats), (statFn, key) => {
    promiseChain.then(regularsStats[statFn].bind(ctx));
  });
}
promiseChain = promiseChain.then(disconnectFromClient(usersClient));
promiseChain = promiseChain.then(disconnectFromClient(dojosClient));
promiseChain = promiseChain.then(disconnectFromClient(eventsClient));

// promiseChain.finally(function() {
//   console.log('Stats finished');
//   process.exit();
// });

function connectToClient (client) {
  return () =>
    new Promise((resolve, reject) => {
      client.connect(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
}

function disconnectFromClient (client) {
  return () =>
    new Promise((resolve, reject) => {
      client.end(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
}

// Functions for stats
function activeDojoChampions () {
  return new Promise((resolve, reject) => {
    usersClient.query(
      `SELECT id from sys_user WHERE init_user_type LIKE '%champion%' AND sys_user.when>= now() - interval '${interval} days' AND sys_user.when<= now();`,
      [],
      (err, { rows }) => {
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
      }
    );
  });
}

function getO13EmailsPerCountry (countryCode) {
  return () =>
    usersDB
      .select('email', 'name')
      .from('cd_profiles')
      .whereRaw(`user_type::text LIKE '%o13%' AND email IS NOT NULL AND alpha2 ='${countryCode}'`)
      .then(o13Profiles => {
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
  usersDB
    .select('user_id', 'email', 'name', 'user_type')
    .from('cd_profiles')
    .whereRaw(`user_type LIKE '%${userType}%'`)
    .then(legacyUsers => {
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
              const filteredUsers = _.filter(
                legacyUsers,
                (
                  { user_id } // console.log(!_.find(users.rows, {user_id: e.user_id}));
                ) => !_.find(users.rows, { user_id })
              );
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
      usersDB.select('email', 'name').from('cd_profiles').whereIn('user_id', champions).then(championsProfiles => {
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

function getEveryNonChampionUsersEmailWithNewsletter () {
  return dojosDB
    .select('user_id')
    .from('cd_usersdojos')
    .whereRaw("array_to_string(user_types, ',') LIKE '%champion%'")
    .then(res =>
      usersDB
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
        })
    );
}

function getChampionsEmailWithNewsletter (countryCode, excludedCountries) {
  return getUserEmailWithNewsletter('champion', countryCode, excludedCountries);
}

function getMentorsEmailWithNewsletter (countryCode, excludedCountries) {
  return getUserEmailWithNewsletter('mentor', countryCode, excludedCountries);
}

function getParentsEmailWithNewsletter (countryCode, excludedCountries) {
  return getUserEmailWithNewsletter('parent-guardian', countryCode, excludedCountries);
}

function getO13sEmailWithNewsletter (countryCode, excludedCountries) {
  return getUserEmailWithNewsletter('o13', countryCode, excludedCountries);
}

function getUserEmailWithNewsletter (userType, countryCode, excludedCountries) {
  let query = `SELECT user_id FROM cd_usersdojos ud INNER JOIN cd_dojos d ON ud.dojo_id = d.id  WHERE ( array_to_string(user_types, ',') LIKE '%${userType}%' )`;
  if (countryCode) {
    query += ` AND alpha2 = '${countryCode}'`; // God this is ugly
  } else if (excludedCountries) {
    excludedCountries.forEach(excludedCountry => {
      query += ` AND alpha2 != '${excludedCountry}'`;
    });
  }
  return () =>
    new Promise((resolve, reject) => {
      console.log(`Getting emails for ${userType} in ${countryCode}`);
      dojosClient.query(query, [], (err, res) => {
        if (err) throw err;
        if (res && res.rows.length > 0) {
          const champions = _.map(res.rows, 'user_id');
          return usersDB
            .select('sys_user.email', 'sys_user.name', 'sys_user.mailing_list', 'cd_profiles.alpha2')
            .from('sys_user')
            .join('cd_profiles', 'sys_user.id', '=', 'cd_profiles.user_id')
            .whereIn('sys_user.id', champions)
            .andWhere('sys_user.mailing_list', 1)
            .then(championsProfiles => {
              if (includeNonDojoMembers) {
                return new Promise((resolve, reject) => {
                  usersDB
                    .select('sys_user.email', 'sys_user.name', 'sys_user.mailing_list', 'cd_profiles.alpha2')
                    .from('sys_user')
                    .join('cd_profiles', 'sys_user.id', '=', 'cd_profiles.user_id')
                    .where('sys_user.init_user_type', 'like', `%${userType}%`)
                    .andWhere('sys_user.mailing_list', 1)
                    .andWhere('cd_profiles.alpha2', countryCode)
                    .then(nonDojoMemberChampionsProfiles => {
                      console.log('nonDojoMemberChampionsProfiles.length', nonDojoMemberChampionsProfiles.length);
                      championsProfiles = championsProfiles.concat(nonDojoMemberChampionsProfiles);
                      resolve(championsProfiles);
                    });
                });
              } else {
                return Promise.resolve(championsProfiles);
              }
            })
            .then(championsProfiles => {
              championsProfiles = _.uniqBy(championsProfiles, 'email');
              if (championsProfiles.length > 0) {
                const csv = json2csv({ data: championsProfiles });
                const fileName = `${userType + (countryCode || '')}Newsletter${excludedCountries &&
                excludedCountries.length > 0
                  ? `_excluding_${excludedCountries.join('_')}`
                  : ''}.csv`;
                fs.writeFile(fileName, csv, err => {
                  if (err) throw err;
                  console.log(`${fileName} saved`);
                  return resolve();
                });
              } else {
                console.log(`No ${userType} signed up to mailing list in ${countryCode}`);
                return resolve();
              }
            });
        } else {
          console.log(`No ${userType} in ${countryCode}`);
          return resolve();
        }
      });
    });
}

// Yup, it's a monstrosity, but it works! :D
function getDojoAndChampionEmails (countryCode) {
  return () =>
    new Promise((resolve1, reject1) => {
      const csvRows = [];
      const promiseChain = dojosDB
        .select('id', 'email', 'name', 'alpha2')
        .from('cd_dojos')
        .where('verified', '=', 1)
        .andWhere('deleted', '=', 0)
        .andWhere('stage', '!=', 4);
      if (countryCode) {
        promiseChain.andWhere('alpha2', '=', countryCode);
      }
      if (address) {
        promiseChain.andWhereRaw(
          `(address1 ILIKE '%${address}%' OR place->>'toponymname' ILIKE '%${address}%' OR place->>'nameWithHierarchy' ILIKE '%${address}%')`
        );
      }
      promiseChain
        .then(
          dojos =>
            new Promise((resolve2, reject2) => {
              const dojosSelectChain = [];
              dojos.forEach(({ id }) => {
                dojosSelectChain.push(
                  dojosDB
                    .select('user_id', 'name', 'email', 'alpha2', 'user_types')
                    .from('cd_usersdojos')
                    .join('cd_dojos', 'cd_usersdojos.dojo_id', '=', 'cd_dojos.id')
                    .where('dojo_id', '=', id)
                );
              });
              Promise.all(dojosSelectChain)
                .then(
                  results =>
                    new Promise((resolve3, reject3) => {
                      const selectChain = [];
                      results.forEach(usersDojos => {
                        usersDojos.forEach(usersDojo => {
                          selectChain.push(
                            (() =>
                              new Promise((resolve, reject) => {
                                usersDB
                                  .select('name', 'email')
                                  .from('cd_profiles')
                                  .where('user_id', '=', usersDojo.user_id)
                                  .then(users => {
                                    users.forEach(user => {
                                      user.dojoName = usersDojo.name;
                                      user.dojoEmail = usersDojo.email;
                                      user.country = usersDojo.alpha2;
                                      user.address = usersDojo.address1;
                                      user.place = usersDojo.place;
                                      user.userTypes = usersDojo.user_types;
                                    });
                                    resolve(users);
                                  });
                              }))()
                          );
                        });
                      });
                      Promise.all(selectChain).then(results => {
                        results.forEach(users => {
                          if (users[0] && users[0].userTypes.indexOf('champion') >= 0) {
                            csvRows.push({
                              championName : users[0].name,
                              championEmail: users[0].email,
                              dojoName     : users[0].dojoName,
                              dojoEmail    : users[0].dojoEmail,
                              country      : users[0].country,
                              userTypes    : JSON.stringify(users[0].userTypes),
                            });
                          }
                        });
                        resolve3();
                      });
                    })
                )
                .then(() => {
                  resolve2();
                });
            })
        )
        .then(() => {
          const csv = json2csv({ data: csvRows });
          fs.writeFile(`${countryCode}_Dojos.csv`, csv, err => {
            if (err) throw err;
            console.log(`${countryCode}_Dojos.csv saved`);
            return resolve1();
          });
        });
    });
}

function getChampionPhonesForPolledDojos () {
  return dojosClient.query(
    'SELECT user_id FROM cd_usersdojos ud INNER JOIN cd_dojos d ON ud.dojo_id = d.id ' +
      " WHERE array_to_string(user_types, ',') LIKE '%champion%' AND d.verified = 1 AND d.deleted = 0 and d.stage != 4",
    [],
    (err, { rows }) => {
      if (err) throw err;
      const champions = _.map(rows, 'user_id');
      return usersDB
        .select('phone', 'name')
        .from('cd_profiles')
        .whereIn('user_id', champions)
        .andWhereRaw("phone IS NOT NULL AND phone != ''")
        .then(({ length }) => {
          console.log('count', length);
          return Promise.resolve();
        });
    }
  );
}

function getDojosFrom (countryCodes) {
  return dojosDB.select('email', 'name').from('cd_dojos').whereIn('alpha2', countryCodes).then(dojos => {
    const csv = json2csv({ data: dojos });
    fs
      .writeFile(`dojosFrom${countryCodes}.csv`, csv, err => {
        if (err) throw err;
        console.log('file saved');
      })
      .then(() => Promise.resolve());
  });
}

function userChampForVerifiedDojo (userId) {
  return new Promise((resolve, reject) => {
    dojosClient.query(
      "SELECT dojo_id FROM cd_usersdojos WHERE user_id=$1 AND array_to_string(user_types, ',') LIKE '%champion%'",
      [userId],
      (err, { rows }) => {
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
      }
    );
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

function activeDojos () {
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
          a.push({
            country: res[i],
            dojos  : 1,
          });
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
    return usersDB('sys_user')
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
      fs.appendFileSync(
        filename,
        `\nCount of Dojos Using Events since ${monthAgo.format('YYYY-MM-DD HH:mm')}: ${length}\n`
      );
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
    eventsDB('cd_applications')
      .count()
      .where('ticket_type', 'ninja')
      .andWhereRaw(eventsDB.raw('attendance IS NOT NULL'))
      .groupByRaw('user_id')
      .havingRaw('count(*) > 1')
      .toSQL()
  );
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

function groupedDojosUsingEvents () {
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

function recentEvents () {
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

function regularEvents () {
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
      fs.appendFileSync(
        filename,
        `\nDojos Createing events recently (in the last 6 weeks): ${_.uniq(recentEvents).length}\n`
      );
      return Promise.resolve();
    })
    .catch(error => {
      console.error(error);
    });
}

// if you want fell free to rewrite these theres too many nested for loops possibly reversing the logic would be better
function newUsers () {
  let o13male = 0;
  let o13female = 0;
  let o13undisclosed = 0;
  let u13undisclosed = 0;
  let u13male = 0;
  let u13female = 0;
  const adults = [];
  const o13 = [];
  const u13 = [];
  return usersDB('sys_user')
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
      return usersDB('cd_profiles')
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
              } else if (
                _.includes(rows[j], o13[i]) &&
                !_.includes(rows[j], 'Male') &&
                !_.includes(rows[j], 'Female')
              ) {
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
              } else if (
                _.includes(rows[j], u13[i]) &&
                !_.includes(rows[j], 'Male') &&
                !_.includes(rows[j], 'Female')
              ) {
                u13undisclosed++;
                j = rows.length;
              }
            }
          }
          fs.appendFileSync(filename, `\nNew users in the past ${interval} days\n`);
          fs.appendFileSync(filename, `Ninjas under 13 ${u13.length}\n`);
          fs.appendFileSync(filename, `Male ${u13male} female ${u13female} Undisclosed ${u13undisclosed}\n`);
          fs.appendFileSync(filename, `Ninjas over 13 ${o13.length}\n`);
          fs.appendFileSync(filename, `Male ${o13male} female ${o13female} Undisclosed ${o13undisclosed}\n`);
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

function totalUsers () {
  let o13male = 0;
  let o13female = 0;
  let o13undisclosed = 0;
  let u13undisclosed = 0;
  let u13male = 0;
  let u13female = 0;
  const adults = [];
  const o13 = [];
  const u13 = [];
  return usersDB('sys_user')
    .select('init_user_type', 'id')
    .then(rows => {
      for (const i in rows) {
        if (_.includes(rows[i].init_user_type, 'attendee-o13')) {
          o13.push(rows[i].id);
        } else if (_.includes(rows[i].init_user_type, 'attendee-u13')) {
          u13.push(rows[i].id);
        } else if (
          !_.includes(rows[i].init_user_type, 'attendee-u13') &&
          !_.includes(rows[i].init_user_type, 'attendee-o13')
        ) {
          adults.push(rows[i].id);
        }
      }
      return usersDB('cd_profiles')
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
              } else if (
                _.includes(rows[j], o13[i]) &&
                !_.includes(rows[j], 'Male') &&
                !_.includes(rows[j], 'Female')
              ) {
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
              } else if (
                _.includes(rows[j], u13[i]) &&
                !_.includes(rows[j], 'Male') &&
                !_.includes(rows[j], 'Female')
              ) {
                u13undisclosed++;
                j = rows.length;
              }
            }
          }
          fs.appendFileSync(filename, '\nTotal users\n');
          fs.appendFileSync(filename, `Ninjas under 13 ${u13.length}\n`);
          fs.appendFileSync(filename, `Male ${u13male} female ${u13female} Undisclosed ${u13undisclosed}\n`);
          fs.appendFileSync(filename, `Ninjas over 13 ${o13.length}\n`);
          fs.appendFileSync(filename, `Male ${o13male} female ${o13female} Undisclosed ${o13undisclosed}\n`);
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

function averageEventCap () {
  return eventsDB('cd_events')
    .join('cd_applications', 'cd_events.id', 'cd_applications.event_id')
    .select(
      'cd_applications.session_id',
      'cd_events.id',
      'cd_events.name',
      'cd_applications.attendance',
      'cd_events.dojo_id'
    )
    .where('created_at', '>', monthAgo.format('YYYY-MM-DD HH:mm:ss'))
    .then(rows => {
      let prev;
      let res = [];
      rows = sortByKey(rows, 'session_id');
      for (const i in rows) {
        if (_.isUndefined(prev)) {
          if (_.isEmpty(rows[i].attendance)) {
            res.push({
              name      : rows[i].name,
              tickets   : 1,
              checkin   : 0,
              session_id: rows[i].session_id,
              dojo_id   : rows[i].dojo_id,
              id        : rows[i].id,
            });
          } else {
            res.push({
              name      : rows[i].name,
              tickets   : 1,
              checkin   : 1,
              session_id: rows[i].session_id,
              dojo_id   : rows[i].dojo_id,
              id        : rows[i].id,
            });
          }
        } else if (rows[i].session_id !== prev.session_id) {
          if (_.isEmpty(rows[i].attendance)) {
            res.push({
              name      : rows[i].name,
              tickets   : 1,
              checkin   : 0,
              session_id: rows[i].session_id,
              dojo_id   : rows[i].dojo_id,
              id        : rows[i].id,
            });
          } else {
            res.push({
              name      : rows[i].name,
              tickets   : 1,
              checkin   : 1,
              session_id: rows[i].session_id,
              dojo_id   : rows[i].dojo_id,
              id        : rows[i].id,
            });
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
                events.push({
                  name    : res[i].name,
                  tickets : res[i].tickets,
                  checkin : res[i].checkin,
                  quantity: rows[j].quantity,
                });
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
          fs.appendFileSync(
            filename,
            `${events[i].name}  tickets Sold ${events[i].tickets} checkins ${events[i]
              .checkin} tickets available ${events[i].quantity}\n`
          );
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
