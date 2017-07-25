import { append } from './util';

export default async function groupedDojosUsingEvents() {
  try {
    append(
      this.filename,
      `\nNumber of events per dojos for${this.monthAgo.format('YYYY-MM-DD HH:mm')}\n`,
    );
    const rows = await this.eventsDB('cd_events')
      .select('dojo_id', this.eventsDB.raw('COUNT(id) as count'))
      .where('created_at', '>', this.monthAgo.format('YYYY-MM-DD HH:mm:ss'))
      .groupByRaw('dojo_id HAVING count(id) >= 5');
    rows.forEach(async ({ dojo_id, count }) => {
      await append(this.filename, `\n${dojo_id}: ${count}\n`); // eslint-disable-line camelcase
    });
  } catch (error) {
    throw error;
  }
}
