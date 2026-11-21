import { describe, expect, it } from 'vitest';
import { sanitizeFlight } from '../../../scripts/sync-flighty';
import type { EventernoteEvent, PublicFlightRecord } from '../../types';
import { generateIcsCalendar } from '../ics-generator';
import { buildTrips, daysBetween, toLocalDateString } from '../trip-cluster';

const makeFlight = (overrides: Partial<PublicFlightRecord>): PublicFlightRecord => ({
  id: 'f-1',
  flight_number: '25',
  airline_name: 'ZIPAIR Tokyo',
  airline_iata: 'ZG',
  departure_airport_iata: 'SFO',
  departure_airport_name: 'San Francisco Intl.',
  departure_city: 'San Francisco',
  departure_country: 'United States',
  departure_timezone: 'America/Los_Angeles',
  departure_terminal: 'I',
  departure_gate: 'G2',
  departureScheduleGateOriginal: '2027-01-20T23:45:00.000Z',
  departureScheduleGateEstimated: null,
  departureScheduleGateActual: null,
  departureScheduleRunwayOriginal: null,
  departureScheduleRunwayEstimated: null,
  departureScheduleRunwayActual: null,
  arrival_airport_iata: 'NRT',
  arrival_airport_name: 'Narita Intl.',
  arrival_city: 'Tokyo',
  arrival_country: 'Japan',
  arrival_timezone: 'Asia/Tokyo',
  arrival_terminal: '1',
  arrival_gate: null,
  arrival_baggage_belt: null,
  arrivalScheduleGateOriginal: '2027-01-21T10:55:00.000Z',
  arrivalScheduleGateEstimated: null,
  arrivalScheduleGateActual: null,
  arrivalScheduleRunwayOriginal: null,
  arrivalScheduleRunwayEstimated: null,
  arrivalScheduleRunwayActual: null,
  is_cancelled: 0,
  distance_km: 8226,
  tail_number: 'JA822J',
  aircraft_model: 'Boeing 787-8',
  aircraft_manufacturer: 'Boeing',
  aircraft_name: null,
  cruising_speed_kmh: 870,
  arrival_weather: null,
  arrival_temp_c: null,
  delay_forecast_mean_min: 18,
  delay_forecast_observations: 60,
  delayForecastEarlyCount: 30,
  delayForecastOntimeCount: 15,
  delayForecastLate15Count: 5,
  delayForecastLate30Count: 5,
  delayForecastLate45Count: 5,
  delayForecastCanceledCount: 0,
  delayForecastDivertedCount: 0,
  checkInScheduleOpen: null,
  checkInScheduleClose: null,
  seat_number: '36C',
  seat_position: 'aisle',
  cabin_class: 'economy',
  flight_reason: null,
  import_source: 'MANUAL',
  ...overrides
});

const makeEvent = (overrides: Partial<EventernoteEvent>): EventernoteEvent => ({
  id: '485105',
  name: 'ラブライブ！蓮ノ空女学院スクールアイドルクラブ Link Live Dream ～103期卒業公演～ Day.1',
  href: '/events/485105',
  url: 'https://www.eventernote.com/events/485105',
  date: '2027-01-23',
  rawDate: '2027-01-23 (土)',
  dayOfWeek: '土',
  place: '日本武道館',
  artists: ['蓮ノ空女学院スクールアイドルクラブ', '楡井希実'],
  ...overrides
});

describe('trip-cluster & ics-generator', () => {
  it('strips booking_reference PNR while keeping seat and aircraft telemetry', () => {
    const raw = {
      id: 'abc',
      flight_number: '2',
      seat_number: '11K',
      booking_reference: 'SECRET1'
    };
    const sanitized = sanitizeFlight(raw);
    expect('booking_reference' in sanitized).toBe(false);
    expect(sanitized.seat_number).toBe('11K');
  });

  it('computes timezone-accurate local dates and daysBetween', () => {
    expect(toLocalDateString('2027-01-20T23:45:00.000Z', 'America/Los_Angeles')).toBe('2027-01-20');
    expect(daysBetween('2027-01-20', '2027-01-25')).toBe(6);
  });

  it('clusters SFO round-trip flights and links matching Eventernote events', () => {
    const outbound = makeFlight({ id: 'out-1' });
    const inbound = makeFlight({
      id: 'in-1',
      flight_number: '26',
      departure_airport_iata: 'NRT',
      departure_city: 'Tokyo',
      departure_country: 'Japan',
      departure_timezone: 'Asia/Tokyo',
      departureScheduleGateOriginal: '2027-01-25T12:25:00.000Z',
      arrival_airport_iata: 'SFO',
      arrival_city: 'San Francisco',
      arrival_country: 'United States',
      arrival_timezone: 'America/Los_Angeles',
      arrivalScheduleGateOriginal: '2027-01-25T21:45:00.000Z'
    });
    const ev = makeEvent({ date: '2027-01-23' });

    const trips = buildTrips([outbound, inbound], [ev], '2026-11-21');
    expect(trips).toHaveLength(1);
    expect(trips[0]!.primaryRegion).toBe('Tokyo, Japan');
    expect(trips[0]!.title).toBe('蓮ノ空 Link Live Dream ～103期卒業公演～');
    expect(trips[0]!.isEventingTrip).toBe(true);
    expect(trips[0]!.events).toHaveLength(1);
    expect(trips[0]!.events[0]!.id).toBe('485105');
    expect(trips[0]!.status).toBe('upcoming');
  });

  it('generates valid RFC 5545 iCalendar output with trip, flight, and event VEVENTs', () => {
    const outbound = makeFlight({ id: 'out-1' });
    const ev = makeEvent({ date: '2027-01-23' });
    const trips = buildTrips([outbound], [ev], '2026-11-21');
    const ics = generateIcsCalendar(trips, [ev], '2026-11-21T20:00:00.000Z');

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('UID:flight-out-1@eventing-tracker.github.io');
    expect(ics).toContain('UID:eventernote-485105@eventing-tracker.github.io');
    expect(ics).toContain('END:VCALENDAR');
  });
});
