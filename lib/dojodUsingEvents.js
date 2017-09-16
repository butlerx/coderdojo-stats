import { append } from './util';

export default async function dojosUsingEvents() {
  try {
    const { length } = await this.eventsDB('cd_events')
      .distinct('dojo_id')
      .select()
      .where('created_at', '>', this.monthAgo.format('YYYY-MM-DD HH:mm:ss'));
    await append(
      this.filename,
      `\nCount of Dojos Using Events since ${this.monthAgo.format('YYYY-MM-DD HH:mm')}: ${length}\n`,
    );
  } catch (error) {
    throw error;
  }
}
