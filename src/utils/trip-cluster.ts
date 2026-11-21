import type { EventernoteEvent, PublicFlightRecord, Trip, TripOverride } from '../types';

const HOME_AIRPORTS = new Set(['SFO', 'SJC', 'OAK']);
const US_GATEWAY_AIRPORTS = new Set(['SFO', 'SJC', 'OAK', 'LAX', 'SEA']);

/** Convert a UTC ISO timestamp into YYYY-MM-DD in a specific IANA timezone. */
export function toLocalDateString(isoUtc: string | null, timeZone: string): string {
  if (!isoUtc) return '';
  try {
    const dt = new Date(isoUtc);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(dt);
  } catch {
    return isoUtc.slice(0, 10);
  }
}

export function formatLocalTime(isoUtc: string | null, timeZone: string): string {
  if (!isoUtc) return '—';
  try {
    const dt = new Date(isoUtc);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(dt);
  } catch {
    return isoUtc.slice(0, 16).replace('T', ' ');
  }
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + delta));
  return dt.toISOString().slice(0, 10);
}

export function daysBetween(startDate: string, endDate: string): number {
  const [y1, m1, d1] = startDate.split('-').map(Number);
  const [y2, m2, d2] = endDate.split('-').map(Number);
  const t1 = Date.UTC(y1!, m1! - 1, d1!);
  const t2 = Date.UTC(y2!, m2! - 1, d2!);
  return Math.max(1, Math.round((t2 - t1) / 86400000) + 1);
}

/**
 * Clusters chronological Flighty records into distinct Trips anchored around SFO,
 * and matches Eventernote events falling within each trip's window.
 */
export function buildTrips(
  flights: PublicFlightRecord[],
  events: EventernoteEvent[],
  todayStr: string = new Date().toISOString().slice(0, 10),
  overrides: TripOverride[] = []
): Trip[] {
  const overrideMap = new Map(overrides.map((o) => [o.id, o]));

  const validFlights = flights
    .filter((f) => !f.is_cancelled && f.departureScheduleGateOriginal)
    .sort((a, b) =>
      (a.departureScheduleGateOriginal ?? '').localeCompare(b.departureScheduleGateOriginal ?? '')
    );

  const clusters: PublicFlightRecord[][] = [];
  let current: PublicFlightRecord[] = [];

  for (let i = 0; i < validFlights.length; i++) {
    const flight = validFlights[i]!;
    const prev = current[current.length - 1];

    if (current.length === 0) {
      current.push(flight);
    } else {
      const prevArrTs = new Date(
        prev!.arrivalScheduleGateOriginal ?? prev!.departureScheduleGateOriginal!
      ).getTime();
      const depTs = new Date(flight.departureScheduleGateOriginal!).getTime();
      const gapDays = (depTs - prevArrTs) / 86400000;

      const prevEndedHome = HOME_AIRPORTS.has(prev!.arrival_airport_iata);
      const startsFromHome = HOME_AIRPORTS.has(flight.departure_airport_iata);
      const prevEndedOpenJawWithGap =
        US_GATEWAY_AIRPORTS.has(prev!.arrival_airport_iata) &&
        prev!.departure_country !== 'United States' &&
        gapDays > 2;

      if (prevEndedHome || startsFromHome || prevEndedOpenJawWithGap || gapDays > 25) {
        clusters.push(current);
        current = [flight];
      } else {
        current.push(flight);
      }
    }

    if (HOME_AIRPORTS.has(flight.arrival_airport_iata)) {
      clusters.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    clusters.push(current);
  }

  const trips: Trip[] = clusters.map((clusterFlights) => {
    const first = clusterFlights[0]!;
    const last = clusterFlights[clusterFlights.length - 1]!;

    const startDate = toLocalDateString(
      first.departureScheduleGateOriginal,
      first.departure_timezone
    );
    const lastArrivalDate = toLocalDateString(
      last.arrivalScheduleGateOriginal ?? last.departureScheduleGateOriginal,
      last.arrival_timezone
    );
    const endDate = lastArrivalDate >= startDate ? lastArrivalDate : startDate;

    const isInternational = clusterFlights.some(
      (f) => f.departure_country !== 'United States' || f.arrival_country !== 'United States'
    );

    const destCities: string[] = [];
    const destCountries: string[] = [];
    const routeAirports: string[] = [first.departure_airport_iata];

    const addCityCountry = (city: string, country: string, iata: string) => {
      if (HOME_AIRPORTS.has(iata)) return;
      if (isInternational && US_GATEWAY_AIRPORTS.has(iata)) return;
      if (city && !destCities.includes(city)) destCities.push(city);
      if (country && !destCountries.includes(country)) destCountries.push(country);
    };

    // Include origin city if trip started mid-journey abroad (e.g. NRT -> LAX return-only leg)
    addCityCountry(first.departure_city, first.departure_country, first.departure_airport_iata);

    for (let i = 0; i < clusterFlights.length; i++) {
      const f = clusterFlights[i]!;
      const next = clusterFlights[i + 1];
      routeAirports.push(f.arrival_airport_iata);

      let isShortTransit = false;
      if (next && f.arrivalScheduleGateOriginal && next.departureScheduleGateOriginal) {
        const layoverHours =
          (new Date(next.departureScheduleGateOriginal).getTime() -
            new Date(f.arrivalScheduleGateOriginal).getTime()) /
          3600000;
        if (
          layoverHours >= 0 &&
          layoverHours < 7 &&
          f.arrival_city === next.departure_city &&
          clusterFlights.length > 2
        ) {
          isShortTransit = true;
        }
      }

      if (!isShortTransit) {
        addCityCountry(f.arrival_city, f.arrival_country, f.arrival_airport_iata);
      }
      if (i > 0) {
        addCityCountry(f.departure_city, f.departure_country, f.departure_airport_iata);
      }
    }

    if (destCities.length === 0) {
      for (const f of clusterFlights) {
        if (!HOME_AIRPORTS.has(f.arrival_airport_iata) && f.arrival_city) {
          if (!destCities.includes(f.arrival_city)) destCities.push(f.arrival_city);
          if (f.arrival_country && !destCountries.includes(f.arrival_country)) {
            destCountries.push(f.arrival_country);
          }
        }
      }
    }

    const windowStart = addDays(startDate, -1);
    const windowEnd = addDays(endDate, 1);
    const matchedEvents = events
      .filter((ev) => ev.date >= windowStart && ev.date <= windowEnd)
      .sort((a, b) => a.date.localeCompare(b.date));

    for (const ev of matchedEvents) {
      if (
        ev.place.includes('横浜') ||
        ev.place.includes('ぴあアリーナ') ||
        ev.place.includes('Kアリーナ') ||
        ev.place.includes('パシフィコ')
      ) {
        if (!destCities.includes('Yokohama')) destCities.push('Yokohama');
      }
      if (ev.place.includes('名古屋') || ev.place.includes('愛知') || ev.place.includes('ポートメッセ')) {
        if (!destCities.includes('Nagoya')) destCities.push('Nagoya');
      }
      if (ev.place.includes('福岡')) {
        if (!destCities.includes('Fukuoka')) destCities.push('Fukuoka');
      }
      if (ev.place.includes('沼津')) {
        if (!destCities.includes('Numazu')) destCities.push('Numazu');
      }
      if (ev.place.includes('大阪') || ev.place.includes('神戸')) {
        if (!destCities.includes('Osaka')) destCities.push('Osaka');
      }
    }

    const id = `trip-${startDate}-${destCities[0]?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'travel'}`;
    const override = overrideMap.get(id);
    if (override?.extraCities) {
      for (const c of override.extraCities) {
        if (!destCities.includes(c)) destCities.push(c);
      }
    }

    const nonUsCountries = destCountries.filter((c) => c !== 'United States');
    const primaryCountry = nonUsCountries[0] ?? destCountries[0] ?? 'Travel';
    const citySummary = destCities.length > 0 ? destCities.join(' · ') : 'Transit';
    const primaryRegion =
      primaryCountry === 'United States'
        ? `${citySummary}, USA`
        : `${citySummary}, ${primaryCountry}`;

    const defaultTitle =
      matchedEvents.length > 0 ? `${citySummary} Eventing Run` : `${citySummary} Trip`;

    const totalDistanceKm = clusterFlights.reduce((sum, f) => sum + (f.distance_km ?? 0), 0);

    const status: Trip['status'] =
      endDate < todayStr
        ? 'past'
        : startDate <= todayStr && todayStr <= endDate
          ? 'active'
          : 'upcoming';

    return {
      id,
      title: override?.title ?? defaultTitle,
      primaryRegion,
      countries: destCountries,
      cities: destCities,
      airports: routeAirports,
      startDate,
      endDate,
      durationDays: daysBetween(startDate, endDate),
      totalDistanceKm,
      flights: clusterFlights,
      events: matchedEvents,
      status,
      isEventingTrip: matchedEvents.length > 0,
      notes: override?.notes
    };
  });

  return trips.sort((a, b) => b.startDate.localeCompare(a.startDate));
}
