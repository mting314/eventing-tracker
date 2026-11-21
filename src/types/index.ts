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

export interface EventernoteEvent {
  id: string;
  name: string;
  href: string;
  url: string;
  date: string;
  rawDate: string;
  dayOfWeek: string;
  place: string;
  artists: string[];
}

export interface Trip {
  id: string;
  title: string;
  primaryRegion: string;
  countries: string[];
  cities: string[];
  airports: string[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
  totalDistanceKm: number;
  flights: PublicFlightRecord[];
  events: EventernoteEvent[];
  status: 'past' | 'active' | 'upcoming';
  isEventingTrip: boolean;
  notes?: string;
}

export interface TripOverride {
  id: string;
  title?: string;
  notes?: string;
  extraCities?: string[];
}
