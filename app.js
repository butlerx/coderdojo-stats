var util = require('util');
var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = require('fs');
var pg = require('pg');
var json2csv = require('json2csv');

pg.types.setTypeParser(20, 'text', parseInt);

var argv = require('minimist')(process.argv.slice(2));
var usersdb = argv.usersdb || 'cp-users-development';
var dojosdb = argv.dojosdb || 'cp-dojos-development';
var eventsdb = argv.eventsdb || 'cp-events-development';
var user = argv.user || 'platform';
var password = argv.password || 'QdYx3D5y';
var interval = argv.interval || '30';

var date = moment();
var monthAgo = moment().day(-interval);

var userDB = require('knex')({
  client: 'pg',
  connection: {
    host     : '127.0.0.1',
    user     : user,
    password : password,
    database : usersdb
  }
});

var dojosDB = require('knex')({
  client: 'pg',
  connection: {
    host     : '127.0.0.1',
    user     : user,
    password : password,
    database : dojosdb
  }
});

var eventsDB = require('knex')({
  client: 'pg',
  connection: {
    host     : '127.0.0.1',
    user     : user,
    password : password,
    database : eventsdb
  }
});

var usersClient = new pg.Client({
  database: usersdb,
  user: user,
  password: password
});
var dojosClient = new pg.Client({
  database: dojosdb,
  user: user,
  password: password
});
var eventsClient = new pg.Client({
  database: eventsdb,
  user: user,
  password: password
});

// Set up file output
var filename = date.format("YYYY-MM-DD") + '-stats.txt';
console.log(filename);
fs.appendFileSync(filename, date.format("YYYY-MM-DD") +'\n');
  numberUsers()
  // .then(getChampionPhonesForPolledDojos())
  // .then(getO13EmailsPerCountry('CZ'))
  // .then(getO13EmailsPerCountry('NL'))
  // .then(getO13EmailsPerCountry('GB'))
  // .then(getO13EmailsPerCountry('IE'))
  // .then(getO13EmailsPerCountry('US'))
  // .then(getO13EmailsPerCountry('FR'))
  // .then(getO13EmailsPerCountry('DE'))
  // .then(getO13EmailsPerCountry('HU'))
  // .then(getO13EmailsPerCountry('IT'))
  // .then(getO13EmailsPerCountry('PL'))
  // .then(getO13EmailsPerCountry('RO'))
  // .then(getO13EmailsPerCountry('ES'))

  // .then(getUsersEmailByOldUserType('mentor'))
  // .then(getChampionsEmailWithNewsletter('IE'))
  .then(getChampionsEmailWithNewsletter('GB'))
  // .then(getChampionsEmailWithNewsletter('US'))
  // .then(getChampionsEmailWithNewsletter('IT'))
  // .then(getChampionsEmailWithNewsletter('IE'))
  // .then(getChampionsEmailWithNewsletter('US'))
  // .then(getChampionsEmailWithNewsletter('FR'))
  // .then(getChampionsEmailWithNewsletter('DE'))
  // .then(getChampionsEmailWithNewsletter('HU'))
  // .then(getChampionsEmailWithNewsletter('IT'))
  // .then(getChampionsEmailWithNewsletter('PL'))
  // .then(getChampionsEmailWithNewsletter('RO'))
  // .then(getChampionsEmailWithNewsletter('ES'))
  // .then(getChampionsEmailWithNewsletter())
  // .then(getEveryNonChampionUsersEmailWithNewsletter)
  // .then(activeDojos)
  // .then(dojosUsingEvents)
  // .then(groupedDojosUsingEvents)
  // .then(recentEvents)
  // .then(regularEvents)
  // .then(newUsers)
  // .then(totalUsers)
  // .then(averageEventCap)
  // .then(NumberOfYouthBookedAndCheckedIn)
  // .then(NumberOfYouthBooked)
  // .then(NumberOfYouthBookedAtLeastTwice)
  // .then(NumberOfYouthBookedAndCheckedInAtLeastTwice)
  // .then(NumberOfDojosWithEventsWithAtLeastOneAttendant)
  // .then(NumberOfDojosWithEventsWithAtLeastOneAttendantWhoCheckedIn)
  .then(function() {
    console.log('Stats finished');
  });
  // numberUsers('mentors'),
// getChampionsEmailFrom('GB');
// getDojosFrom(['GB', 'IE']);


// Connect to db and execute
usersClient.connect(function (err) {
  if (err) throw err;
  dojosClient.connect(function (err) {
    if (err) throw err;
    eventsClient.connect(function (err) {
      if (err) throw err;
      activeDojoChampions().then(function () {
        usersClient.end(function (err) {
          if (err) throw err;
        });
        dojosClient.end(function (err) {
          if (err) throw err;
        });
        eventsClient.end(function (err) {
          if (err) throw err;
        });
      });
    });
  });
});


// Functions for stats
function activeDojoChampions() {
  console.log(arguments.callee.name);
  return new Promise(function (resolve, reject) {
    usersClient.query('SELECT id from sys_user WHERE init_user_type LIKE \'%champion%\' AND sys_user.when>= now() - interval \''+ interval + ' days\' AND sys_user.when<= now();', [], function (err, res) {
      if (err) throw err;
      var promises = [];
      for (var i = 0; i < res.rows.length; i++) {
        promises.push(userChampForVerifiedDojo(res.rows[i].id));
      }
      Promise.all(promises).then(function (values) {
        var usersInVerifiedDojos = 0;
        values.forEach(function (val) {
          if (val === true) usersInVerifiedDojos++;
        });
        fs.appendFileSync(filename, '\nnew champions with registed dojos: ' +  usersInVerifiedDojos +'\n');
        resolve();
      }, function (reason) {
        reject(reason);
      });
    });
  });
}

function getO13EmailsPerCountry (countryCode) {
  console.log(arguments.callee.name);
  return userDB.select('email', 'name').from('cd_profiles').whereRaw('user_type::text LIKE \'%o13%\' AND email IS NOT NULL AND alpha2 =\'' + countryCode+'\'')
  .then(function(o13Profiles){
    if (o13Profiles.length > 0){
      var csv = json2csv({ data: o13Profiles });
      fs.writeFile('o13From'+countryCode+'.csv', csv, function(err) {
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
  console.log(arguments.callee.name);
  userDB.select('user_id', 'email', 'name', 'user_type').from('cd_profiles').whereRaw('user_type LIKE \'%'+ userType +'%\'')
    .then(function (legacyUsers){
      console.log('legacyUsers', legacyUsers.length);
      return new Promise( function(resolve, reject) {
        dojosClient.query('SELECT user_id FROM cd_usersdojos ud INNER JOIN cd_dojos d ON ud.dojo_id = d.id ' +
          ' WHERE ( array_to_string(user_types, \',\') LIKE \'%champion%\' OR array_to_string(user_types, \',\')  LIKE \'%mentor%\' )', [],
          function (err, users) {
            if (users && users.rows.length > 0) {
              console.log('users', users.rows.length);
              var filteredUsers = _.filter(legacyUsers, function(e) {
                // console.log(!_.find(users.rows, {user_id: e.user_id}));
                return !_.find(users.rows, {user_id: e.user_id});
              });
              console.log('filteredUsers1', filteredUsers.length, _.last(filteredUsers));
              return resolve(filteredUsers);
            } else {
              return resolve();
            }
          });
        }
      ).then(function(filteredUsers){
        console.log('filteredUsers2',filteredUsers.length);
        if (filteredUsers && filteredUsers.length > 0) {
          var csv = json2csv({ data: filteredUsers });
          fs.writeFile('legacy' + userType + '.csv', csv, function (err) {
            if (err) throw err;
            console.log('file saved');
          });
        }
        return Promise.resolve();
    });
  });
}


function getChampionsEmailFrom (countryCode) {
  console.log(arguments.callee.name);
  return dojosClient.query('SELECT user_id FROM cd_usersdojos ud INNER JOIN cd_dojos d ON ud.dojo_id = d.id ' +
  ' WHERE ( array_to_string(user_types, \',\') LIKE \'%champion%\' OR array_to_string(user_types, \',\')  LIKE \'%mentor%\' ) AND (d.alpha2=\'GB\' OR d.alpha2=\'IE\')', [],
  function (err, res) {
    var champions = _.map(res.rows, 'user_id');
    console.log(champions);
    userDB.select('email', 'name').from('cd_profiles').whereIn('user_id', champions)
      .then(function(championsProfiles){
        console.log(championsProfiles);
        var csv = json2csv({ data: championsProfiles });
        fs.writeFile('championsFrom'+countryCode+'.csv', csv, function(err) {
          if (err) throw err;
          console.log('file saved');
        }).then(function(){
          return Promise.resolve();
        });
      });
  });
}

function getEveryNonChampionUsersEmailWithNewsletter () {
  console.log(arguments.callee.name);
  return dojosDB.select('user_id').from('cd_usersdojos').whereRaw('array_to_string(user_types, \',\') LIKE \'%champion%\'')
  .then(function (res) {
    return userDB.select('email', 'name', 'init_user_type', 'mailing_list').from('sys_user')
    .whereNotIn('id', _.map(res, 'user_id')).andWhere('mailing_list', 1).andWhereRaw('init_user_type::text NOT LIKE \'%attendee%\'')
    .then( function (users) {
      console.log(users.length);
      var csv = json2csv({ data: users });
      return fs.writeFile('usersNewsletter.csv', csv, function(err) {
        if (err) throw err;
        console.log('file saved');
      });
    });
  });
}

function getChampionsEmailWithNewsletter (countryCode) {
  console.log(arguments.callee.name);
  var query = 'SELECT user_id FROM cd_usersdojos ud INNER JOIN cd_dojos d ON ud.dojo_id = d.id ' +
    ' WHERE ( array_to_string(user_types, \',\') LIKE \'%champion%\' OR array_to_string(user_types, \',\')  LIKE \'%mentor%\' )';
  if (countryCode) query += ' AND alpha2 = \'' + countryCode + '\''; // God this is ugly
  return new Promise( function(resolve, reject) {
    dojosClient.query(query, [],
     function (err, res) {
       console.log(arguments.callee.name, countryCode, err);
       if (res && res.rows.length > 0) {
         console.log(arguments.callee.name, res.rows.length, countryCode);
         var champions = _.map(res.rows, 'user_id');
         console.log(champions.length);
         return userDB.select('email', 'name', 'mailing_list').from('sys_user').whereIn('id', champions).andWhere('mailing_list', 1)
           .then(function(championsProfiles){
             var csv = json2csv({ data: championsProfiles });
             fs.writeFile('champions'+ countryCode +'Newsletter.csv', csv, function(err) {
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

function getChampionPhonesForPolledDojos () {
  console.log(arguments.callee.name);
  return dojosClient.query('SELECT user_id FROM cd_usersdojos ud INNER JOIN cd_dojos d ON ud.dojo_id = d.id ' +
  ' WHERE array_to_string(user_types, \',\') LIKE \'%champion%\' AND d.verified = 1 AND d.deleted = 0 and d.stage != 4', [],
  function (err, res) {
    var champions = _.map(res.rows, 'user_id');
    return userDB.select('phone', 'name').from('cd_profiles').whereIn('user_id', champions).andWhereRaw('phone IS NOT NULL AND phone != \'\'')
      .then(function(championsProfiles){
        console.log('count', championsProfiles.length);
        return Promise.resolve();
      });
  });
}


function getDojosFrom(countryCodes) {
  console.log(arguments.callee.name);
  return dojosDB.select('email', 'name').from('cd_dojos').whereIn('alpha2', countryCodes)
  .then(function (dojos){
    var csv = json2csv({ data: dojos });
    fs.writeFile('dojosFrom'+countryCodes+'.csv', csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    }).then(function(){
      return Promise.resolve();
    });
  });
}

function userChampForVerifiedDojo(userId) {
  console.log(arguments.callee.name);
  return new Promise(function (resolve, reject) {
    dojosClient.query('SELECT dojo_id FROM cd_usersdojos WHERE user_id=$1 AND array_to_string(user_types, \',\') LIKE \'%champion%\'', [userId], function (err, res) {
      if (err) reject(err);
      var promises = [];
      for (var i = 0; i < res.rows.length; i++) {
        promises.push(dojoVerified(res.rows[i].dojo_id));
      }
      Promise.all(promises).then(function (values) {
        resolve(values.indexOf(true) !== -1);
      }, function (reason) {
        reject(reason);
      });
    });
  });
}

function dojoVerified(dojoId) {
  return new Promise(function (resolve, reject) {
    dojosClient.query('SELECT verified FROM cd_dojos WHERE id=$1', [dojoId], function (err, res) {
      if (err) reject(err);
      var verified = false;
      for (var i = 0; i < res.rows.length; i++) {
        verified = verified || res.rows[i].verified === 1;
      }
      resolve(verified);
    });
  });
}

function activeDojos() {
  console.log(arguments.callee.name);
  return dojosDB('cd_dojos').where({
    verified: 1,
    deleted: 0,
  }).whereNot('stage', '4').select('country_name').then( function (rows) {
    var a = [], prev, res = [];
    for ( var i in rows) {
      res.push(rows[i].country_name);
    }
    res.sort();
    for ( var i in res) {
        if ( res[i] !== prev ) {
            a.push({ country: res[i], dojos: 1});
        } else {
            a[a.length-1].dojos++
        }
        prev = res[i];
    }
    fs.appendFileSync(filename, '\nActive Dojos Broken Down by Country\n');
    for (var i in a) {
      fs.appendFileSync(filename, a[i].country + ': ' + a[i].dojos + '\n');
    }
    return Promise.resolve();
  }).catch(function(error) {
    console.error(error);
  });
}

// TODO fix by rewirting in to multiple queries
/*function verifiedDojoChamp() {
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
}*/

function numberUsers(type) {
  console.log(arguments.callee.name);
  if(_.isUndefined(type)) {
    return userDB('sys_user').count('*').then( function (rows) {
      fs.appendFileSync(filename, '\nCount of All Users: ' + rows[0].count + '\n');
      return Promise.resolve();
    }).catch(function(error) {
      console.error(error);
    });
  } else {
    return Promise.reject('Unhandled scenario');
  }
}

function dojosUsingEvents () {
  return eventsDB('cd_events').distinct('dojo_id').select().where('created_at', '>', monthAgo.format("YYYY-MM-DD HH:mm:ss")).then( function (rows) {
    fs.appendFileSync(filename, '\nCount of Dojos Using Events since ' + monthAgo.format("YYYY-MM-DD HH:mm") + ': ' + rows.length + '\n');
    return Promise.resolve();
  })
  .then(function(){
    console.log('dojosUsingEventsFinished');
    return Promise.resolve();
  })
  .catch(function(error) {
    console.error(error);
  });
}

function NumberOfDojosWithEventsWithAtLeastOneAttendant () {
  return eventsDB('cd_events').join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id').select('cd_applications.dojo_id').groupByRaw('cd_applications.dojo_id').then( function (rows) {
    fs.appendFileSync(filename, '\nCount of Dojos Using Events With at least an attendant' + rows.length + '\n');
    return Promise.resolve();
  })
  .then(function(){
    console.log('eventsWithAtLeastOneAttendant');
    return Promise.resolve();
  })
  .catch(function(error) {
    console.error(error);
  });
}

function NumberOfDojosWithEventsWithAtLeastOneAttendantWhoCheckedIn () {
  return eventsDB('cd_events').join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id').select('cd_applications.dojo_id').whereRaw('cd_applications.attendance IS NOT NULL').groupByRaw('cd_applications.dojo_id').then( function (rows) {
    fs.appendFileSync(filename, '\nCount of Dojos Using Events With at least an attendant who checked in' + rows.length + '\n');
    return Promise.resolve();
  })
  .then(function(){
    console.log('NumberOfDojosWithEventsWithAtLeastOneAttendantWhoCheckedIn');
    return Promise.resolve();
  })
  .catch(function(error) {
    console.error(error);
  });
}

function NumberOfYouthBookedAndCheckedIn(){
  return eventsDB('cd_applications').select().where('ticket_type', 'ninja').andWhereRaw(eventsDB.raw('attendance IS NOT NULL')).then( function (rows) {
    fs.appendFileSync(filename, '\nNumber of Youth booked who checked in' + rows.length + '\n');
    return Promise.resolve();
  })
  .then(function(){
    console.log('NumberOfYouthBookedAndCheckedIn');
    return Promise.resolve();
  })
  .catch(function(error) {
    console.error(error);
  });
}

function NumberOfYouthBooked(){
  return eventsDB('cd_applications').select().where('ticket_type', 'ninja').then( function (rows) {
    fs.appendFileSync(filename, '\nNumber of Youth booked' + rows.length + '\n');
    return Promise.resolve();
  })
  .then(function(){
    console.log('NumberOfYouthBooked');
    return Promise.resolve();
  })
  .catch(function(error) {
    console.error(error);
  });
}

function NumberOfYouthBookedAtLeastTwice(){
  return eventsDB('cd_applications').count().where('ticket_type', 'ninja').groupByRaw('user_id').havingRaw('count(*) > 1')
  .then( function (rows) {
    fs.appendFileSync(filename, '\nNumber of Youth booked At least twice' + rows.length + '\n');
    return Promise.resolve();
  })
  .then(function(){
    console.log('NumberOfYouthBookedAtLeastTwice');
    return Promise.resolve();
  })
  .catch(function(error) {
    console.error(error);
  });
}


function NumberOfYouthBookedAndCheckedInAtLeastTwice(){
  console.log(eventsDB('cd_profiles').whereIn('user_type', ['attendee-u13', 'attendee-o13',]).andWhereRaw(eventsDB.raw('attendance IS NOT NULL'))
    .groupByRaw('user_id').havingRaw('count(*) > 1').toSQL());
  return eventsDB('cd_applications').count().where('ticket_type', 'ninja').andWhereRaw(eventsDB.raw('attendance IS NOT NULL'))
    .groupByRaw('user_id').havingRaw('count(*) > 1')
  .then( function (rows) {
    fs.appendFileSync(filename, '\nNumber of Youth booked and checked in at least twice' + rows.length + '\n');
    return true;
  })
  .then(function(){
    console.log('NumberOfYouthBookedAndCheckedInAtLeastTwice');
    return Promise.resolve();
  })
  .catch(function(error) {
    console.error(error);
  });
}

function NumberOfYouthBookedAndCheckedInAtLeastTwice(){
  console.log(eventsDB('cd_applications').count().where('ticket_type', 'ninja').andWhereRaw(eventsDB.raw('attendance IS NOT NULL'))
    .groupByRaw('user_id').havingRaw('count(*) > 1').toSQL());
  return eventsDB('cd_applications').count().where('ticket_type', 'ninja').andWhereRaw(eventsDB.raw('attendance IS NOT NULL'))
    .groupByRaw('user_id').havingRaw('count(*) > 1')
  .then( function (rows) {
    fs.appendFileSync(filename, '\nNumber of Youth booked and checked in at least twice' + rows.length + '\n');
    return true;
  })
  .then(function(){
    console.log('NumberOfYouthBookedAndCheckedInAtLeastTwice');
    return Promise.resolve();
  })
  .catch(function(error) {
    console.error(error);
  });
}



function groupedDojosUsingEvents () {
  console.log(arguments.callee.name);
  fs.appendFileSync(filename, '\nNumber of events per dojos for' + monthAgo.format("YYYY-MM-DD HH:mm") + '\n');
  return eventsDB('cd_events').select('dojo_id', eventsDB.raw('COUNT(id) as count')).where('created_at', '>', monthAgo.format("YYYY-MM-DD HH:mm:ss")).groupByRaw('dojo_id HAVING count(id) >= 5').then( function (rows) {
    Promise.each(rows, function(event){
      fs.appendFileSync(filename, '\n' + event.dojo_id + ': ' + event.count + '\n');
      return Promise.resolve();
    })
    .then(function(){
      console.log('groupedDojosUsingEventsFinished');
      return Promise.resolve();
    });
  }).catch(function(error) {
    console.error(error);
  });
}

function recentEvents () {
  console.log(arguments.callee.name);
  return eventsDB('cd_events').select().where('created_at', '>', monthAgo.format("YYYY-MM-DD HH:mm:ss")).then( function (rows) {
    fs.appendFileSync(filename, '\nTotal Count of Events since ' + monthAgo.format("YYYY-MM-DD HH:mm") + ': ' + rows.length + '\n');
    return true;
  }).catch(function(error) {
    console.error(error);
  });
}

function regularEvents () {
  console.log(arguments.callee.name);
  var recent = moment().week(-6), recentEvents = [] ;
  return eventsDB('cd_events').select('dates', 'dojo_id').then( function (rows) {
    for( var i in rows) {
      for(var j = 0; j < rows[i].dates.length; j++) {
        if (rows[i].dates[j].startTime > recent.format()) {
          recentEvents.push(rows[i].dojo_id);
          j = rows[i].dates.length;
        }
      }
    }
    fs.appendFileSync(filename, '\nDojos Createing events recently (in the last 6 weeks): ' + _.uniq(recentEvents).length + '\n');
    return Promise.resolve();
  }).catch(function(error) {
    console.error(error);
  });
}

// if you want fell free to rewrite these theres too many nested for loops possibly reversing the logic would be better
function newUsers () {
  console.log(arguments.callee.name);
  var o13male = 0, o13female = 0, o13undisclosed = 0, u13undisclosed = 0, u13male = 0, u13female = 0, adults = [], o13 = [], u13 = [];
  return userDB('sys_user').select('init_user_type', 'id').where('when', '>', monthAgo.format("YYYY-MM-DD HH:mm:ss")).then( function (rows) {
    for (var i in rows) {
      if ( _.includes(rows[i].init_user_type, 'attendee-o13')) {
        o13.push(rows[i].id);
      } else if ( _.includes(rows[i].init_user_type, 'attendee-u13')) {
        u13.push(rows[i].id);
      } else if ( _.includes(rows[i].init_user_type, 'parent-guardian')) {
        adults.push(rows[i].id);
      }
    }
    return userDB('cd_profiles').select('user_id', 'gender').then( function (rows) {
      for (var i in o13) {
        for (var j = 0; j< rows.length; j++) {
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
      for (var i in u13) {
        for (var j = 0; j< rows.length; j++) {
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
      fs.appendFileSync(filename, '\nNew users in the past ' + interval + ' days\n');
      fs.appendFileSync(filename, 'Ninjas under 13 ' + u13.length + '\n');
      fs.appendFileSync(filename, 'Male ' + u13male + ' female ' + u13female + ' Undisclosed ' + u13undisclosed + '\n');
      fs.appendFileSync(filename, 'Ninjas over 13 ' + o13.length + '\n');
      fs.appendFileSync(filename, 'Male ' + o13male + ' female ' + o13female + ' Undisclosed ' + o13undisclosed + '\n');
      fs.appendFileSync(filename, 'Adults ' + adults.length + '\n');
      console.log('that stupid long one is done, i blame the db');
      return Promise.resolve();
    }).catch(function(error) {
      console.error(error);
    });
  }).catch(function(error) {
    console.error(error);
  });
}

function totalUsers () {
  console.log(arguments.callee.name);
  var o13male = 0, o13female = 0, o13undisclosed = 0, u13undisclosed = 0, u13male = 0, u13female = 0, adults = [], o13 = [], u13 = [];
  return userDB('sys_user').select('init_user_type', 'id').then( function (rows) {
    for (var i in rows) {
      if ( _.includes(rows[i].init_user_type, 'attendee-o13')) {
        o13.push(rows[i].id);
      } else if ( _.includes(rows[i].init_user_type, 'attendee-u13')) {
        u13.push(rows[i].id);
      } else if ( !_.includes(rows[i].init_user_type, 'attendee-u13') && !_.includes(rows[i].init_user_type, 'attendee-o13')) {
        adults.push(rows[i].id);
      }
    }
    return userDB('cd_profiles').select('user_id', 'gender').then( function (rows) {
      for (var i in o13) {
        for (var j = 0; j< rows.length; j++) {
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
      for (var i in u13) {
        for (var j = 0; j< rows.length; j++) {
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
      fs.appendFileSync(filename, 'Ninjas under 13 ' + u13.length + '\n');
      fs.appendFileSync(filename, 'Male ' + u13male + ' female ' + u13female + ' Undisclosed ' + u13undisclosed + '\n');
      fs.appendFileSync(filename, 'Ninjas over 13 ' + o13.length + '\n');
      fs.appendFileSync(filename, 'Male ' + o13male + ' female ' + o13female + ' Undisclosed ' + o13undisclosed + '\n');
      fs.appendFileSync(filename, 'Adults ' + adults.length + '\n');
      console.log('that other stupid long one is done, i blame the db');
      return Promise.resolve();
    }).catch(function(error) {
      console.error(error);
    });
  }).catch(function(error) {
    console.error(error);
  });
}

function averageEventCap () {
  console.log(arguments.callee.name);
  return eventsDB('cd_events').join('cd_applications', 'cd_events.id', 'cd_applications.event_id').select('cd_applications.session_id', 'cd_events.id', 'cd_events.name','cd_applications.attendance', 'cd_events.dojo_id').where('created_at', '>', monthAgo.format("YYYY-MM-DD HH:mm:ss")).then( function (rows) {
    var prev, res = [];
    rows = sortByKey(rows, 'session_id');
    for (var i in rows) {
      if (_.isUndefined(prev)) {
        if(_.isEmpty(rows[i].attendance)) {
          res.push({ name: rows[i].name, tickets: 1, checkin: 0, session_id: rows[i].session_id, dojo_id: rows[i].dojo_id, id: rows[i].id});
        } else {
          res.push({ name: rows[i].name, tickets: 1, checkin: 1, session_id: rows[i].session_id, dojo_id: rows[i].dojo_id, id: rows[i].id});
        }
      } else if (rows[i].session_id !== prev.session_id) {
        if(_.isEmpty(rows[i].attendance)) {
          res.push({ name: rows[i].name, tickets: 1, checkin: 0, session_id: rows[i].session_id, dojo_id: rows[i].dojo_id, id: rows[i].id});
        } else {
          res.push({ name: rows[i].name, tickets: 1, checkin: 1, session_id: rows[i].session_id, dojo_id: rows[i].dojo_id, id: rows[i].id});
        }
      } else {
        if(_.isEmpty(rows[i].attendance)) {
          res[res.length-1].tickets++;
        } else {
          res[res.length-1].tickets++;
          res[res.length-1].checkin++;
        }
      }
      prev = rows[i];
    }
    res = sortByKey(res, 'id');
    var prev = {}, events = [];
    return eventsDB('cd_tickets').select('quantity', 'session_id').then( function (rows) {
      console.log('checking tickets');
      for (var i in res) {
        if (res[i].id !== prev.id) {
          for (var j = 0; j < rows.length; j++) {
            if (res[i].session_id === rows[j].session_id) {
              events.push({ name: res[i].name, tickets: res[i].tickets, checkin: res[i].checkin, quantity: rows[j].quantity});
              j = rows.length;
            }
          }
        } else {
          for (var j = 0; j < rows.length; j++) {
            if (res[i].session_id === rows[j].session_id) {
              events[events.length-1].tickets += res[i].tickets;
              events[events.length-1].checkin += res[i].checkin;
              events[events.length-1].quantity += row[j].checkin;
              j = rows.length;
            }
          }
        }
      }
      fs.appendFileSync(filename, '\nTickets Sold\n');
      for (var i in events) {
        fs.appendFileSync(filename, events[i].name + ' ' + ' tickets Sold ' + events[i].tickets + ' checkins ' + events[i].checkin + ' tickets available ' + events[i].quantity + '\n');
      }
      console.log('written');
      return Promise.resolve();
    });
  }).catch(function(error) {
    console.error(error);
  });
}

function sortByKey(array, key) {
  return array.sort(function(a, b) {
    var x = a[key]; var y = b[key];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}
