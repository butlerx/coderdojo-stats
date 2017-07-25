import s3 from 's3';
import moment from 'moment';
import { log } from '.';

const date = moment();

export default async function s3Upload(
  accessKeyId,
  secretAccessKey,
  Bucket = 'coderdojo-stats',
  region = 'eu-west-1',
) {
  const client = s3.createClient({
    s3Options: {
      accessKeyId,
      secretAccessKey,
      region,
    },
  });

  const uploader = client.uploadDir({
    localDir: 'stats',
    s3Params: {
      Bucket,
      Prefix: `stats-${date}`,
    },
  });

  uploader.on('error', (err) => {
    log('unable to upload:', err.stack);
    throw err;
  });
  uploader.on('progress', () => {
    log('progress', uploader.progressMd5Amount, uploader.progressAmount, uploader.progressTotal);
  });
  uploader.on('end', () => {
    log('done uploading');
  });
}
