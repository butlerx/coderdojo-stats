import { append } from './util';

export default async function NumberOfDojosWithEventsWithAtLeastOneAttendant() {
  try {
    const { length } = await this.eventsDB('cd_events')
      .join('cd_applications', 'cd_events.dojo_id', 'cd_applications.dojo_id')
      .select('cd_applications.dojo_id')
      .groupByRaw('cd_applications.dojo_id');
    await append(
      this.filename,
      `\nCount of Dojos Using Events With at least an attendant${length}\n`,
    );
  } catch (error) {
    throw error;
  }
}
