import program from 'commander';
import connection from './connection';
import pkg from '../../package.json';

program
  .version(pkg.version)
  .usage('[options]')
  .option('--get-stats', 'Output stats to file')
  .option('--get-reg-stats', 'Output regular stats to file and uplod to s3')
  .option('--interval', 'Amount of previous days to gather stats for')
  .option('--get-champions', 'Output champions emails signed up to mailing list to file')
  .option('--get-mentors', 'Output mentors emails signed up to mailing list to file')
  .option('--get-parents', 'Output parents emails signed up to mailing list to file')
  .option('--get-o13s', 'Output O13s emails signed up to mailing list to file')
  .option('--get-dojos', 'Output all dojo and champion emails to file')
  .option(
    '--include-non-dojo-members',
    'Include emails of those not a member of a dojo in email dump',
  )
  .option('--countries <items>', 'Comma separated list of country alpha2 codes', val =>
    val.split(','),
  )
  .option(
    '--excluded-countries <items>',
    'Comma separated list of country alpha2 codes to be excluded',
    val => val.split(','),
  )
  .option('--address <address>', 'A partial address to match across the address and city fields')
  .option('--usersdb', 'Database name for users database')
  .option('--dojosdb', 'Database name for dojos database')
  .option('--eventsdb', 'Database name for events database')
  .option('--users-host', 'Database address for users database')
  .option('--dojos-host', 'Database address for dojos database')
  .option('--events-host', 'Database address for events database')
  .option('--user', 'Database user')
  .option('--password', 'Database password')
  .option('--aws-key-id', 'Access key for aws')
  .option('--aws-secret-key', 'Secret key for aws')
  .parse(process.argv);

export const interval = program.interval || '30';
export const getStats = program.getStats || false;
export const getRegularStats = program.getRegStats || false;
export const getChampions = program.getChampions || false;
export const getMentors = program.getMentors || false;
export const getParents = program.getParents || false;
export const getO13s = program.getO13s || false;
export const getDojos = program.getDojos || false;
export const includeNonDojoMembers = program.includeNonDojoMembers || false;
export const countries = program.countries || [];
export const excludedCountries = program.excludedCountries || [];
export const stats = connection({
  user: program.user || 'platform',
  password: program.password || 'QdYx3D5y',
  usersHost: program.usersHost || 'localhost',
  dojosHost: program.dojosHost || 'localhost',
  eventsHost: program.eventsHost || 'localhost',
  usersdb: program.usersdb || 'cp-users-development',
  dojosdb: program.dojosdb || 'cp-dojos-development',
  eventsdb: program.eventsdb || 'cp-events-development',
});
const outputHelp = program.outputHelp;
export const help = outputHelp.bind(program);
export const aws = {
  keyId: program.awsKeyId,
  secretKey: program.awsSecretKey,
};
