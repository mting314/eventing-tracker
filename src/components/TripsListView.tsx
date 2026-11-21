import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCalendarDays,
  FaMagnifyingGlass,
  FaMicrophoneLines,
  FaPlane,
  FaRoute
} from 'react-icons/fa6';
import { Box, Flex, Grid, HStack, Stack } from 'styled-system/jsx';
import type { Trip } from '~/types';
import { EventernoteCard } from './EventernoteCard';
import { FlightLegRow } from './FlightLegRow';

type TripFilter = 'upcoming' | 'eventing' | 'all' | 'past';

export function TripsListView({
  trips,
  onSelectTrip
}: {
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<TripFilter>('upcoming');
  const [query, setQuery] = useState('');

  const counts = useMemo(
    () => ({
      all: trips.length,
      upcoming: trips.filter((tr) => tr.status !== 'past').length,
      eventing: trips.filter((tr) => tr.isEventingTrip).length,
      past: trips.filter((tr) => tr.status === 'past').length
    }),
    [trips]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = trips.filter((tr) => {
      if (filter === 'upcoming' && tr.status === 'past') return false;
      if (filter === 'eventing' && !tr.isEventingTrip) return false;
      if (filter === 'past' && tr.status !== 'past') return false;
      if (!q) return true;

      const haystack = [
        tr.title,
        tr.primaryRegion,
        tr.startDate,
        tr.endDate,
        ...tr.cities,
        ...tr.countries,
        ...tr.airports,
        ...tr.flights.flatMap((f) => [
          `${f.airline_iata}${f.flight_number}`,
          f.airline_name,
          f.aircraft_model ?? '',
          f.departure_city,
          f.arrival_city
        ]),
        ...tr.events.flatMap((ev) => [ev.name, ev.place, ...ev.artists])
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });

    // Sort upcoming soonest first, past most recent first
    if (filter === 'upcoming') {
      return [...list].sort((a, b) => a.startDate.localeCompare(b.startDate));
    }
    return [...list].sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [trips, filter, query]);

  const filterOptions: { key: TripFilter; label: string }[] = [
    { key: 'upcoming', label: t('trips.filter_upcoming', { count: counts.upcoming }) },
    { key: 'eventing', label: t('trips.filter_eventing', { count: counts.eventing }) },
    { key: 'all', label: t('trips.filter_all', { count: counts.all }) },
    { key: 'past', label: t('trips.filter_past', { count: counts.past }) }
  ];

  return (
    <Stack gap="4">
      <Flex justify="space-between" align="center" wrap="wrap" gap="3">
        <HStack gap="2" flexWrap="wrap">
          {filterOptions.map((opt) => {
            const active = filter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFilter(opt.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: active
                    ? '#e4007f'
                    : 'rgba(255, 255, 255, 0.06)',
                  color: active ? '#fff' : 'rgba(255, 255, 255, 0.78)',
                  border: active
                    ? '1px solid #ff87b8'
                    : '1px solid rgba(255, 255, 255, 0.14)'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </HStack>

        <Box position="relative" flex="1" minW="260px" maxW="420px">
          <FaMagnifyingGlass
            size={13}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.45)'
            }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('trips.search_placeholder')}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '9999px',
              fontSize: '13px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.16)'
            }}
          />
        </Box>
      </Flex>

      <Stack gap="4">
        {filtered.map((trip) => (
          <Box
            key={trip.id}
            borderRadius="xl"
            p={{ base: '4', md: '5' }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.025)',
              border: trip.isEventingTrip
                ? '1px solid rgba(228, 0, 127, 0.38)'
                : '1px solid rgba(0, 160, 224, 0.3)'
            }}
          >
            <Stack gap="4">
              <Flex justify="space-between" align="flex-start" wrap="wrap" gap="3">
                <Stack gap="1">
                  <HStack gap="2" flexWrap="wrap">
                    <Box
                      as="span"
                      px="2.5"
                      py="0.5"
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="bold"
                      style={{
                        backgroundColor:
                          trip.status === 'active'
                            ? 'rgba(34, 197, 94, 0.22)'
                            : trip.status === 'upcoming'
                              ? 'rgba(255, 122, 0, 0.22)'
                              : 'rgba(255, 255, 255, 0.08)',
                        color:
                          trip.status === 'active'
                            ? '#4ade80'
                            : trip.status === 'upcoming'
                              ? '#fdba74'
                              : 'rgba(255,255,255,0.65)'
                      }}
                    >
                      {trip.status.toUpperCase()}
                    </Box>

                    <Box
                      as="span"
                      px="2.5"
                      py="0.5"
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="bold"
                      style={{
                        backgroundColor: trip.isEventingTrip
                          ? 'rgba(228, 0, 127, 0.22)'
                          : 'rgba(0, 160, 224, 0.2)',
                        color: trip.isEventingTrip ? '#ff87b8' : '#38bdf8'
                      }}
                    >
                      {trip.primaryRegion}
                    </Box>

                    <HStack
                      gap="1"
                      fontSize="xs"
                      color="fg.muted"
                      fontVariantNumeric="tabular-nums"
                    >
                      <FaCalendarDays size={11} style={{ color: '#e4007f' }} />
                      <span>
                        {trip.startDate} → {trip.endDate} (
                        {t('trips.days_count', { count: trip.durationDays })})
                      </span>
                    </HStack>
                  </HStack>

                  <Box
                    textStyle="display"
                    fontSize={{ base: 'lg', md: 'xl' }}
                    fontWeight="bold"
                  >
                    {trip.title}
                  </Box>

                  <HStack gap="3" fontSize="xs" color="fg.muted" flexWrap="wrap">
                    <HStack gap="1">
                      <FaPlane size={11} style={{ color: '#38bdf8' }} />
                      <span>Route: {trip.airports.join(' ✈ ')}</span>
                    </HStack>
                    {trip.totalDistanceKm > 0 && (
                      <HStack gap="1">
                        <FaRoute size={11} style={{ color: '#ff7a00' }} />
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {trip.totalDistanceKm.toLocaleString()} km (
                          {Math.round(trip.totalDistanceKm * 0.621371).toLocaleString()} mi)
                        </span>
                      </HStack>
                    )}
                  </HStack>
                </Stack>

                <button
                  type="button"
                  onClick={() => onSelectTrip(trip)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffd0e0',
                    border: '1px solid rgba(255, 255, 255, 0.16)'
                  }}
                >
                  Open Drawer
                </button>
              </Flex>

              <Grid
                gridTemplateColumns={{
                  base: '1fr',
                  lg: trip.events.length > 0 ? '1fr 1fr' : '1fr'
                }}
                gap="4"
                alignItems="start"
              >
                <Stack gap="2">
                  <HStack gap="1.5" fontSize="xs" fontWeight="bold" style={{ color: '#38bdf8' }}>
                    <FaPlane size={11} />
                    <span>
                      {t('trips.telemetry_heading')} ({trip.flights.length})
                    </span>
                  </HStack>
                  <Stack gap="2">
                    {trip.flights.map((f) => (
                      <FlightLegRow key={f.id} flight={f} compact />
                    ))}
                  </Stack>
                </Stack>

                {trip.events.length > 0 && (
                  <Stack gap="2">
                    <HStack gap="1.5" fontSize="xs" fontWeight="bold" style={{ color: '#ff87b8' }}>
                      <FaMicrophoneLines size={11} />
                      <span>
                        {t('trips.events_heading')} ({trip.events.length})
                      </span>
                    </HStack>
                    <Stack gap="2">
                      {trip.events.map((ev) => (
                        <EventernoteCard key={ev.id} event={ev} compact />
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Grid>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
