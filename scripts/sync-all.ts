/**
 * Full sync pipeline:
 * 1. Sync Flighty flights (from SQLite DB if accessible, else preserves existing data/flights.json)
 * 2. Sync Eventernote events for user tinmsnake
 * 3. Build clustered trips (data/trips.json) and subscribable iCal feed (public/calendar.ics)
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getUserEvents } from './sync-eventernote';
import { readFlightsFromSqlite } from './sync-flighty';

const here = dirname(fileURLToPath(import.meta.url));
const flightsPath = join(here, '../data/flights.json');
const eventsPath = join(here, '../data/events.json');

mkdirSync(join(here, '../data'), { recursive: true });

try {
  const flights = await readFlightsFromSqlite();
  writeFileSync(flightsPath, JSON.stringify(flights, null, 2));
  console.log(`✅ Synced ${flights.length} flights from Flighty SQLite DB`);
} catch (err) {
  if (existsSync(flightsPath)) {
    console.log(
      `ℹ️ Flighty SQLite DB not directly accessible (${(err as Error).message}); using existing ${flightsPath}`
    );
  } else {
    throw err;
  }
}

const events = await getUserEvents('tinmsnake');
writeFileSync(eventsPath, JSON.stringify(events, null, 2));
console.log(`✅ Synced ${events.length} events from Eventernote (tinmsnake)`);

await import('./build-trips');
