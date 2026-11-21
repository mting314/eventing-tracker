import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Flex, Grid, HStack, Stack } from 'styled-system/jsx';
import type { EventernoteEvent, PublicFlightRecord, Trip } from '~/types';

const EARTH_CIRCUMFERENCE_KM = 40075;

function countTop(items: string[], limit = 8): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const clean = item.trim();
    if (!clean) continue;
    counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function StatsView({
  trips,
  flights,
  events
}: {
  trips: Trip[];
  flights: PublicFlightRecord[];
  events: EventernoteEvent[];
}) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const validFlights = flights.filter((f) => !f.is_cancelled);
    const totalKm = validFlights.reduce((s, f) => s + (f.distance_km ?? 0), 0);
    const totalMiles = Math.round(totalKm * 0.621371);
    const earthLoops = (totalKm / EARTH_CIRCUMFERENCE_KM).toFixed(2);
    const upcomingTrips = trips.filter((tr) => tr.status !== 'past').length;

    const topAirports = countTop(
      validFlights.flatMap((f) => [
        `${f.departure_airport_iata} (${f.departure_city})`,
        `${f.arrival_airport_iata} (${f.arrival_city})`
      ])
    );

    const topAirlines = countTop(
      validFlights.map((f) => `${f.airline_name} (${f.airline_iata})`)
    );

    const topVenues = countTop(events.map((e) => e.place));
    const topArtists = countTop(events.flatMap((e) => e.artists), 10);

    // Year x Month activity heatmap
    const yearMonthCounts = new Map<string, { flights: number; events: number }>();
    const activeYearsSet = new Set<string>();

    for (const f of validFlights) {
      const ym = f.departureScheduleGateOriginal?.slice(0, 7);
      if (!ym) continue;
      activeYearsSet.add(ym.slice(0, 4));
      const cur = yearMonthCounts.get(ym) ?? { flights: 0, events: 0 };
      cur.flights += 1;
      yearMonthCounts.set(ym, cur);
    }

    for (const ev of events) {
      const ym = ev.date.slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(ym)) continue;
      activeYearsSet.add(ym.slice(0, 4));
      const cur = yearMonthCounts.get(ym) ?? { flights: 0, events: 0 };
      cur.events += 1;
      yearMonthCounts.set(ym, cur);
    }

    const activeYears = [...activeYearsSet].sort().reverse();

    return {
      totalTrips: trips.length,
      upcomingTrips,
      totalFlights: validFlights.length,
      totalKm,
      totalMiles,
      earthLoops,
      totalEvents: events.length,
      topAirports,
      topAirlines,
      topVenues,
      topArtists,
      activeYears,
      yearMonthCounts
    };
  }, [trips, flights, events]);

  const statTiles = [
    {
      label: t('stats.total_trips'),
      value: String(stats.totalTrips),
      sub: `${trips.filter((t) => t.isEventingTrip).length} eventing runs`,
      color: '#ff87b8'
    },
    {
      label: t('stats.upcoming_trips'),
      value: String(stats.upcomingTrips),
      sub: 'Booked in Flighty',
      color: '#fdba74'
    },
    {
      label: t('stats.total_flights'),
      value: String(stats.totalFlights),
      sub: `${stats.topAirlines.length}+ airlines flown`,
      color: '#38bdf8'
    },
    {
      label: t('stats.total_distance'),
      value: `${stats.totalMiles.toLocaleString()} mi`,
      sub: `${stats.totalKm.toLocaleString()} km · ${t('stats.earth_loops', { loops: stats.earthLoops })}`,
      color: '#38bdf8'
    },
    {
      label: t('stats.eventernote_events'),
      value: String(stats.totalEvents),
      sub: 'Synced from tinmsnake',
      color: '#ff87b8'
    }
  ];

  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  return (
    <Stack gap="6">
      {/* 5 Hero Stat Tiles */}
      <Grid gridTemplateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }} gap="3">
        {statTiles.map((tile) => (
          <Box
            key={tile.label}
            p="4"
            borderRadius="xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Stack gap="1">
              <Box fontSize="xs" color="fg.muted" fontWeight="semibold">
                {tile.label}
              </Box>
              <Box
                textStyle="display"
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="black"
                fontVariantNumeric="tabular-nums"
                style={{ color: tile.color }}
              >
                {tile.value}
              </Box>
              <Box fontSize="2xs" color="fg.muted">
                {tile.sub}
              </Box>
            </Stack>
          </Box>
        ))}
      </Grid>

      {/* Activity Heatmap (Year x Month) */}
      <Box
        p="4"
        borderRadius="xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Stack gap="3">
          <Flex justify="space-between" align="center" wrap="wrap" gap="2">
            <Box textStyle="display" fontSize="md" fontWeight="bold">
              Eventing & Flight Activity Heatmap (Year × Month)
            </Box>
            <Box fontSize="xs" color="fg.muted">
              🎤 Events · ✈️ Flights
            </Box>
          </Flex>
          <Box overflowX="auto">
            <Stack gap="1.5" minW="540px">
              <Grid gridTemplateColumns="60px repeat(12, 1fr)" gap="1.5">
                <Box />
                {months.map((m) => (
                  <Box key={m} fontSize="2xs" color="fg.muted" textAlign="center">
                    {m}月
                  </Box>
                ))}
              </Grid>
              {stats.activeYears.map((yr) => (
                <Grid key={yr} gridTemplateColumns="60px repeat(12, 1fr)" gap="1.5" alignItems="center">
                  <Box fontSize="xs" fontWeight="bold" fontVariantNumeric="tabular-nums">
                    {yr}
                  </Box>
                  {months.map((m) => {
                    const cell = stats.yearMonthCounts.get(`${yr}-${m}`);
                    const evCount = cell?.events ?? 0;
                    const flCount = cell?.flights ?? 0;
                    const total = evCount + flCount;
                    const alpha =
                      total === 0 ? 0.03 : Math.min(0.85, 0.15 + total * 0.09);
                    return (
                      <Box
                        key={`${yr}-${m}`}
                        title={`${yr}-${m}: ${evCount} events, ${flCount} flights`}
                        p="1.5"
                        borderRadius="md"
                        textAlign="center"
                        fontSize="2xs"
                        fontVariantNumeric="tabular-nums"
                        style={{
                          backgroundColor:
                            evCount > 0
                              ? `rgba(228, 0, 127, ${alpha})`
                              : flCount > 0
                                ? `rgba(0, 160, 224, ${alpha})`
                                : 'rgba(255, 255, 255, 0.03)',
                          border:
                            total > 0
                              ? '1px solid rgba(255, 255, 255, 0.15)'
                              : '1px solid rgba(255, 255, 255, 0.04)'
                        }}
                      >
                        {total > 0 ? `${evCount > 0 ? `🎤${evCount}` : ''}${flCount > 0 ? ` ✈${flCount}` : ''}` : '·'}
                      </Box>
                    );
                  })}
                </Grid>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* 4 Breakdown Cards */}
      <Grid gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="4">
        {[
          {
            title: t('stats.top_airports'),
            items: stats.topAirports,
            barColor: 'linear-gradient(90deg, #00a0e0, #38bdf8)'
          },
          {
            title: t('stats.top_airlines'),
            items: stats.topAirlines,
            barColor: 'linear-gradient(90deg, #00a0e0, #818cf8)'
          },
          {
            title: t('stats.top_venues'),
            items: stats.topVenues,
            barColor: 'linear-gradient(90deg, #e4007f, #ff7a00)'
          },
          {
            title: t('stats.top_artists'),
            items: stats.topArtists,
            barColor: 'linear-gradient(90deg, #e4007f, #ff87b8)'
          }
        ].map((card) => {
          const maxCount = card.items[0]?.count ?? 1;
          return (
            <Box
              key={card.title}
              p="4"
              borderRadius="xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Stack gap="3">
                <Box textStyle="display" fontSize="md" fontWeight="bold">
                  {card.title}
                </Box>
                <Stack gap="2">
                  {card.items.map((item) => (
                    <Stack key={item.name} gap="1">
                      <HStack justify="space-between" fontSize="xs">
                        <Box as="span" fontWeight="medium" style={{ wordBreak: 'break-word' }}>
                          {item.name}
                        </Box>
                        <Box
                          as="span"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                          color="fg.muted"
                        >
                          {item.count}
                        </Box>
                      </HStack>
                      <Box
                        w="full"
                        h="2"
                        borderRadius="full"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                      >
                        <Box
                          h="full"
                          borderRadius="full"
                          style={{
                            width: `${Math.max(6, Math.round((item.count / maxCount) * 100))}%`,
                            background: card.barColor
                          }}
                        />
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Grid>
    </Stack>
  );
}
