import { log, append } from '../util';

export default async function nbEventsSince() {
  const db = this.db;
  try {
    const rows = await db
      .eventsDB('cd_events')
      .select()
      .where('created_at', '>', this.monthAgo.format('YYYY-MM-DD HH:mm:ss'));
    if (this.output) {
      await append(
        this.filename,
        `\nTotal Count of Events since ${this.monthAgo.format(
          'YYYY-MM-DD HH:mm',
        )}: ${rows.length}\n`,
      );
    }
    return rows;
  } catch (error) {
    log(error);
  }
}
