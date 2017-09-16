import { log, append } from '../util';

export default async function nbDojoLeadInStep(step) {
  try {
    const rows = await this.db.dojosDB('cd_dojoleads').where('current_step', '=', step);
    if (this.output) {
      await append(this.filename, `\nCount of dojo leads in step ${step}:${rows.length}\n`);
    }
    return rows;
  } catch (err) {
    log(err);
  }
}
