/**
 * Combines data/flights.json + data/events.json (+ optional data/trip-overrides.json)
 * into data/trips.json and public/calendar.ics.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { EventernoteEvent, PublicFlightRecord, TripOverride } from '../src/types';
import { generateIcsCalendar } from '../src/utils/ics-generator';
import { translateEventNameToEn, translateVenueToEn } from '../src/utils/translate-ja-en';
import { buildTrips } from '../src/utils/trip-cluster';

const here = dirname(fileURLToPath(import.meta.url));
const flightsPath = join(here, '../data/flights.json');
const eventsPath = join(here, '../data/events.json');
const overridesPath = join(here, '../data/trip-overrides.json');
const tripsOutPath = join(here, '../data/trips.json');
const icsOutPath = join(here, '../public/calendar.ics');

const flights: PublicFlightRecord[] = existsSync(flightsPath)
  ? JSON.parse(readFileSync(flightsPath, 'utf8'))
  : [];
const rawEvents: EventernoteEvent[] = existsSync(eventsPath)
  ? JSON.parse(readFileSync(eventsPath, 'utf8'))
  : [];
const events: EventernoteEvent[] = rawEvents.map((ev) => ({
  ...ev,
  nameEn: translateEventNameToEn(ev.name),
  placeEn: translateVenueToEn(ev.place)
}));
if (existsSync(eventsPath)) {
  writeFileSync(eventsPath, JSON.stringify(events, null, 2));
}
const overrides: TripOverride[] = existsSync(overridesPath)
  ? JSON.parse(readFileSync(overridesPath, 'utf8'))
  : [];

const todayStr = process.env.TODAY_OVERRIDE ?? new Date().toISOString().slice(0, 10);
const trips = buildTrips(flights, events, todayStr, overrides);

mkdirSync(dirname(tripsOutPath), { recursive: true });
writeFileSync(tripsOutPath, JSON.stringify(trips, null, 2));

const icsContent = generateIcsCalendar(trips, events);
mkdirSync(dirname(icsOutPath), { recursive: true });
writeFileSync(icsOutPath, icsContent);

const upcomingTrips = trips.filter((t) => t.status !== 'past');
const eventingTrips = trips.filter((t) => t.isEventingTrip);

console.log(
  `✅ Built ${trips.length} trips (${upcomingTrips.length} upcoming/active, ${eventingTrips.length} with linked Eventernote events)`
);
console.log(`✅ Generated subscribable iCal feed at ${icsOutPath}`);
