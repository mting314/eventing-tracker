/**
 * Syncs Flighty flights to data/flights.json.
 * Can either read directly from Flighty's local SQLite DB (MainFlightyDatabase.db)
 * via node:sqlite, or import from an MCP flighty_list_flights JSON snapshot.
 * Strips only `booking_reference` (PNR) for public safety; preserves all other telemetry.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export interface PublicFlightRecord {
  id: string;
  flight_number: string;
  airline_name: string;
  airline_iata: string;
  departure_airport_iata: string;
  departure_airport_name: string;
  departure_city: string;
  departure_country: string;
  departure_timezone: string;
  departure_terminal: string | null;
  departure_gate: string | null;
  departureScheduleGateOriginal: string | null;
  departureScheduleGateEstimated: string | null;
  departureScheduleGateActual: string | null;
  departureScheduleRunwayOriginal: string | null;
  departureScheduleRunwayEstimated: string | null;
  departureScheduleRunwayActual: string | null;
  arrival_airport_iata: string;
  arrival_airport_name: string;
  arrival_city: string;
  arrival_country: string;
  arrival_timezone: string;
  arrival_terminal: string | null;
  arrival_gate: string | null;
  arrival_baggage_belt: string | null;
  arrivalScheduleGateOriginal: string | null;
  arrivalScheduleGateEstimated: string | null;
  arrivalScheduleGateActual: string | null;
  arrivalScheduleRunwayOriginal: string | null;
  arrivalScheduleRunwayEstimated: string | null;
  arrivalScheduleRunwayActual: string | null;
  is_cancelled: number;
  distance_km: number | null;
  tail_number: string | null;
  aircraft_model: string | null;
  aircraft_manufacturer: string | null;
  aircraft_name: string | null;
  cruising_speed_kmh: number | null;
  arrival_weather: string | null;
  arrival_temp_c: number | null;
  delay_forecast_mean_min: number | null;
  delay_forecast_observations: number | null;
  delayForecastEarlyCount: number | null;
  delayForecastOntimeCount: number | null;
  delayForecastLate15Count: number | null;
  delayForecastLate30Count: number | null;
  delayForecastLate45Count: number | null;
  delayForecastCanceledCount: number | null;
  delayForecastDivertedCount: number | null;
  checkInScheduleOpen: string | null;
  checkInScheduleClose: string | null;
  seat_number: string | null;
  seat_position: string | null;
  cabin_class: string | null;
  flight_reason: string | null;
  import_source: string | null;
}

const here = dirname(fileURLToPath(import.meta.url));
const outputPath = join(here, '../data/flights.json');

const DEFAULT_DB_PATH =
  process.env.FLIGHTY_DB_PATH ??
  join(
    homedir(),
    'Library/Containers/com.flightyapp.flighty/Data/Documents/MainFlightyDatabase.db'
  );

export function sanitizeFlight(raw: Record<string, unknown>): PublicFlightRecord {
  const copy = { ...raw };
  delete copy.booking_reference;
  return copy as unknown as PublicFlightRecord;
}

export async function readFlightsFromSqlite(
  dbPath: string = DEFAULT_DB_PATH
): Promise<PublicFlightRecord[]> {
  const sqliteMod = 'node:sqlite';
  const { DatabaseSync } = (await import(/* @vite-ignore */ sqliteMod)) as {
    DatabaseSync: new (
      path: string,
      options?: { readOnly?: boolean }
    ) => {
      prepare: (sql: string) => {
        get: (...args: unknown[]) => unknown;
        all: (...args: unknown[]) => unknown[];
      };
      close: () => void;
    };
  };
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const ownerRow = db
      .prepare(
        `SELECT userId, COUNT(*) AS cnt FROM (
           SELECT userId FROM UserFlight WHERE deleted IS NULL
           UNION ALL
           SELECT userId FROM UserManualFlight WHERE deleted IS NULL
         ) GROUP BY userId ORDER BY cnt DESC LIMIT 1`
      )
      .get() as { userId: string } | undefined;

    if (!ownerRow) throw new Error('Could not determine Flighty owner userId');

    const query = `
      WITH flights_combined AS (
        SELECT
          id, number, airlineId, departureAirportId, scheduledArrivalAirportId,
          departureTerminal, departureGate,
          departureScheduleGateOriginal, departureScheduleGateEstimated, departureScheduleGateActual,
          departureScheduleRunwayOriginal, departureScheduleRunwayEstimated, departureScheduleRunwayActual,
          arrivalTerminal, arrivalGate, arrivalBaggageBelt,
          arrivalScheduleGateOriginal, arrivalScheduleGateEstimated, arrivalScheduleGateActual,
          arrivalScheduleRunwayOriginal, arrivalScheduleRunwayEstimated, arrivalScheduleRunwayActual,
          isCancelled, distance,
          equipmentTailNumber, equipmentModelName, equipmentManufacturer, equipmentPlaneName, equipmentCruisingSpeed,
          arrivalWeatherConditionName AS arrivalWeatherCondition, arrivalWeatherTemperature,
          delayForecastDelayMean, delayForecastObservations,
          delayForecastEarlyCount, delayForecastOntimeCount,
          delayForecastLate15Count, delayForecastLate30Count, delayForecastLate45Count,
          delayForecastCanceledCount, delayForecastDivertedCount,
          checkInScheduleOpen, checkInScheduleClose,
          deleted
        FROM Flight
        UNION ALL
        SELECT
          id, number, airlineId, departureAirportId, scheduledArrivalAirportId,
          departureTerminal, departureGate,
          departureScheduleGateOriginal, NULL, departureScheduleGateActual,
          departureScheduleRunwayOriginal, NULL, departureScheduleRunwayActual,
          arrivalTerminal, arrivalGate, arrivalBaggageBelt,
          arrivalScheduleGateOriginal, NULL, arrivalScheduleGateActual,
          arrivalScheduleRunwayOriginal, NULL, arrivalScheduleRunwayActual,
          isCancelled, distance,
          equipmentTailNumber, equipmentModelName, equipmentManufacturer, equipmentPlaneName, equipmentCruisingSpeed,
          arrivalWeatherConditionName, arrivalWeatherTemperature,
          delayForecastDelayMean, delayForecastObservations,
          delayForecastEarlyCount, delayForecastOntimeCount,
          delayForecastLate15Count, delayForecastLate30Count, delayForecastLate45Count,
          delayForecastCanceledCount, delayForecastDivertedCount,
          NULL, NULL,
          deleted
        FROM ManualFlight
      ),
      user_flights_combined AS (
        SELECT userId, flightId, importSource, deleted, isMyFlight FROM UserFlight
        UNION ALL
        SELECT userId, flightId, importSource, deleted, isMyFlight FROM UserManualFlight
      )
      SELECT
        f.id,
        f.number AS flight_number,
        al.name AS airline_name,
        al.iata AS airline_iata,
        dep.iata AS departure_airport_iata,
        dep.name AS departure_airport_name,
        dep.city AS departure_city,
        dep.country AS departure_country,
        dep.timeZoneIdentifier AS departure_timezone,
        f.departureTerminal AS departure_terminal,
        f.departureGate AS departure_gate,
        f.departureScheduleGateOriginal,
        f.departureScheduleGateEstimated,
        f.departureScheduleGateActual,
        f.departureScheduleRunwayOriginal,
        f.departureScheduleRunwayEstimated,
        f.departureScheduleRunwayActual,
        arr.iata AS arrival_airport_iata,
        arr.name AS arrival_airport_name,
        arr.city AS arrival_city,
        arr.country AS arrival_country,
        arr.timeZoneIdentifier AS arrival_timezone,
        f.arrivalTerminal AS arrival_terminal,
        f.arrivalGate AS arrival_gate,
        f.arrivalBaggageBelt AS arrival_baggage_belt,
        f.arrivalScheduleGateOriginal,
        f.arrivalScheduleGateEstimated,
        f.arrivalScheduleGateActual,
        f.arrivalScheduleRunwayOriginal,
        f.arrivalScheduleRunwayEstimated,
        f.arrivalScheduleRunwayActual,
        f.isCancelled AS is_cancelled,
        f.distance AS distance_km,
        f.equipmentTailNumber AS tail_number,
        f.equipmentModelName AS aircraft_model,
        f.equipmentManufacturer AS aircraft_manufacturer,
        f.equipmentPlaneName AS aircraft_name,
        f.equipmentCruisingSpeed AS cruising_speed_kmh,
        f.arrivalWeatherCondition AS arrival_weather,
        f.arrivalWeatherTemperature AS arrival_temp_c,
        f.delayForecastDelayMean AS delay_forecast_mean_min,
        f.delayForecastObservations AS delay_forecast_observations,
        f.delayForecastEarlyCount,
        f.delayForecastOntimeCount,
        f.delayForecastLate15Count,
        f.delayForecastLate30Count,
        f.delayForecastLate45Count,
        f.delayForecastCanceledCount,
        f.delayForecastDivertedCount,
        f.checkInScheduleOpen,
        f.checkInScheduleClose,
        t.seatNumber AS seat_number,
        t.seatPosition AS seat_position,
        t.cabinClass AS cabin_class,
        t.flightReason AS flight_reason,
        uf.importSource AS import_source
      FROM flights_combined f
      JOIN Airport dep ON f.departureAirportId = dep.id
      JOIN Airport arr ON f.scheduledArrivalAirportId = arr.id
      JOIN Airline al ON f.airlineId = al.id
      JOIN user_flights_combined uf ON f.id = uf.flightId
      LEFT JOIN Ticket t ON f.id = t.flightId AND uf.userId = t.userId
      WHERE uf.deleted IS NULL AND f.deleted IS NULL AND uf.isMyFlight = 1 AND uf.userId = ?
      ORDER BY f.departureScheduleGateOriginal DESC
    `;

    const tsCols = [
      'departureScheduleGateOriginal',
      'departureScheduleGateEstimated',
      'departureScheduleGateActual',
      'departureScheduleRunwayOriginal',
      'departureScheduleRunwayEstimated',
      'departureScheduleRunwayActual',
      'arrivalScheduleGateOriginal',
      'arrivalScheduleGateEstimated',
      'arrivalScheduleGateActual',
      'arrivalScheduleRunwayOriginal',
      'arrivalScheduleRunwayEstimated',
      'arrivalScheduleRunwayActual',
      'checkInScheduleOpen',
      'checkInScheduleClose'
    ];

    const rows = db.prepare(query).all(ownerRow.userId) as Record<string, unknown>[];
    return rows.map((r) => {
      const copy = { ...r };
      for (const col of tsCols) {
        const val = copy[col] as number | null | undefined;
        copy[col] = val != null && val > 0 ? new Date(val * 1000).toISOString() : null;
      }
      return sanitizeFlight(copy);
    });
  } finally {
    db.close();
  }
}

export function readFlightsFromJsonSnapshot(snapshotPath: string): PublicFlightRecord[] {
  const raw = JSON.parse(readFileSync(snapshotPath, 'utf8')) as {
    results?: Record<string, unknown>[];
  };
  const list = Array.isArray(raw) ? raw : (raw.results ?? []);
  return list.map(sanitizeFlight);
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const snapshotArg = process.argv[2];
  let flights: PublicFlightRecord[];
  if (snapshotArg && existsSync(snapshotArg)) {
    console.log(`Reading Flighty flights from snapshot ${snapshotArg}...`);
    flights = readFlightsFromJsonSnapshot(snapshotArg);
  } else {
    console.log(`Reading Flighty flights from SQLite ${DEFAULT_DB_PATH}...`);
    flights = await readFlightsFromSqlite(DEFAULT_DB_PATH);
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(flights, null, 2));
  console.log(`✅ Wrote ${flights.length} sanitized flights (PNRs removed) to ${outputPath}`);
}
