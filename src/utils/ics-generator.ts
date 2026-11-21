import type { EventernoteEvent, Trip } from '../types';

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function toIcsDateValue(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

function toIcsUtcDateTime(isoUtc: string): string {
  const dt = new Date(isoUtc);
  return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function addOneDayIcs(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + 1));
  return dt.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Generates an RFC 5545 subscribable iCalendar (.ics) file containing:
 * 1. Multi-day all-day Trip span banners
 * 2. Exact timed Flight legs with terminal/gate/seat/aircraft info
 * 3. All Eventernote events with venue, performers, and canonical URL
 */
export function generateIcsCalendar(
  trips: Trip[],
  events: EventernoteEvent[],
  generatedAtIso: string = new Date().toISOString()
): string {
  const dtStamp = toIcsUtcDateTime(generatedAtIso);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//tinmsnake//Eventing & Travel Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:tinmsnake Travel & Eventing Calendar',
    'X-WR-TIMEZONE:Asia/Tokyo',
    'X-WR-CALDESC:Public travel blocks (Flighty) and attended concerts/events (Eventernote: tinmsnake)'
  ];

  // 1. Add multi-day Trip spans
  for (const trip of trips) {
    const eventNames = trip.events.map((e) => `• ${e.name} (${e.place})`).join('\n');
    const flightCodes = trip.flights
      .map((f) => `${f.airline_iata}${f.flight_number} (${f.departure_airport_iata}→${f.arrival_airport_iata})`)
      .join(', ');
    const desc = [
      `Destination: ${trip.primaryRegion}`,
      `Flights: ${flightCodes}`,
      trip.events.length > 0 ? `Events (${trip.events.length}):\n${eventNames}` : 'No linked Eventernote events'
    ].join('\n\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${trip.id}@eventing-tracker.github.io`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${toIcsDateValue(trip.startDate)}`,
      `DTEND;VALUE=DATE:${addOneDayIcs(trip.endDate)}`,
      `SUMMARY:${escapeIcsText(`✈️ ${trip.title} (${trip.primaryRegion})`)}`,
      `LOCATION:${escapeIcsText(trip.primaryRegion)}`,
      `DESCRIPTION:${escapeIcsText(desc)}`,
      'END:VEVENT'
    );

    // 2. Add individual Flight legs
    for (const f of trip.flights) {
      if (!f.departureScheduleGateOriginal || !f.arrivalScheduleGateOriginal) continue;
      const code = `${f.airline_iata}${f.flight_number}`;
      const summary = `🛫 ${code}: ${f.departure_airport_iata} → ${f.arrival_airport_iata} (${f.airline_name})`;
      const flightDesc = [
        `Flight: ${f.airline_name} (${code})`,
        `Route: ${f.departure_city} (${f.departure_airport_iata}) → ${f.arrival_city} (${f.arrival_airport_iata})`,
        f.departure_terminal ? `Departure Terminal: ${f.departure_terminal}` : null,
        f.arrival_terminal ? `Arrival Terminal: ${f.arrival_terminal}` : null,
        f.aircraft_model ? `Aircraft: ${f.aircraft_model}` : null,
        f.seat_number ? `Seat: ${f.seat_number}${f.seat_position ? ` (${f.seat_position})` : ''}` : null,
        f.cabin_class ? `Cabin: ${f.cabin_class}` : null,
        f.distance_km ? `Distance: ${f.distance_km} km` : null
      ]
        .filter(Boolean)
        .join('\n');

      lines.push(
        'BEGIN:VEVENT',
        `UID:flight-${f.id}@eventing-tracker.github.io`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${toIcsUtcDateTime(f.departureScheduleGateOriginal)}`,
        `DTEND:${toIcsUtcDateTime(f.arrivalScheduleGateOriginal)}`,
        `SUMMARY:${escapeIcsText(summary)}`,
        `LOCATION:${escapeIcsText(`${f.departure_airport_name} (${f.departure_airport_iata})`)}`,
        `DESCRIPTION:${escapeIcsText(flightDesc)}`,
        'END:VEVENT'
      );
    }
  }

  // 3. Add all Eventernote events
  for (const ev of events) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.date)) continue;
    const desc = [
      `Venue: ${ev.place || 'TBA'}`,
      ev.artists.length > 0 ? `Performers: ${ev.artists.join(', ')}` : null,
      `Eventernote: ${ev.url}`
    ]
      .filter(Boolean)
      .join('\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:eventernote-${ev.id}@eventing-tracker.github.io`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${toIcsDateValue(ev.date)}`,
      `DTEND;VALUE=DATE:${addOneDayIcs(ev.date)}`,
      `SUMMARY:${escapeIcsText(`🎤 ${ev.name}`)}`,
      `LOCATION:${escapeIcsText(ev.place)}`,
      `URL:${ev.url}`,
      `DESCRIPTION:${escapeIcsText(desc)}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
