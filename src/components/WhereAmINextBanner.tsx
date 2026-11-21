import { useTranslation } from 'react-i18next';
import {
  FaCalendarCheck,
  FaHouse,
  FaLocationDot,
  FaMicrophoneLines,
  FaPlaneDeparture
} from 'react-icons/fa6';
import { Box, Flex, Grid, HStack, Stack } from 'styled-system/jsx';
import type { Trip } from '~/types';
import { clickable } from '~/utils/clickable';
import { daysBetween } from '~/utils/trip-cluster';
import { EventernoteCard } from './EventernoteCard';
import { FlightLegRow } from './FlightLegRow';

export function WhereAmINextBanner({
  trips,
  todayStr,
  onSelectTrip
}: {
  trips: Trip[];
  todayStr: string;
  onSelectTrip: (trip: Trip) => void;
}) {
  const { t } = useTranslation();

  const activeTrip = trips.find((tr) => tr.status === 'active');
  const upcomingTrips = trips
    .filter((tr) => tr.status === 'upcoming')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const spotlightTrip = activeTrip ?? upcomingTrips[0];
  const nextQueue = activeTrip ? upcomingTrips.slice(0, 3) : upcomingTrips.slice(1, 4);

  if (!spotlightTrip) return null;

  const daysUntil =
    spotlightTrip.status === 'active'
      ? 0
      : Math.max(0, daysBetween(todayStr, spotlightTrip.startDate) - 1);

  return (
    <Box
      borderRadius="xl"
      borderWidth="1px"
      p={{ base: '4', md: '5' }}
      style={{
        borderColor: 'rgba(228, 0, 127, 0.45)',
        background:
          'linear-gradient(135deg, rgba(228, 0, 127, 0.14) 0%, rgba(255, 122, 0, 0.08) 50%, rgba(0, 160, 224, 0.14) 100%)'
      }}
    >
      <Stack gap="4">
        <Flex justify="space-between" align="center" wrap="wrap" gap="3">
          <HStack gap="2.5" flexWrap="wrap">
            <HStack
              gap="1.5"
              px="3"
              py="1"
              borderRadius="full"
              fontSize="xs"
              fontWeight="bold"
              style={{
                backgroundColor: activeTrip
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'rgba(228, 0, 127, 0.25)',
                color: activeTrip ? '#4ade80' : '#ff87b8',
                border: activeTrip
                  ? '1px solid rgba(34, 197, 94, 0.45)'
                  : '1px solid rgba(228, 0, 127, 0.5)'
              }}
            >
              {activeTrip ? <FaPlaneDeparture size={12} /> : <FaHouse size={12} />}
              <span>
                {activeTrip
                  ? `${t('hero.status_active')}: ${activeTrip.primaryRegion}`
                  : t('hero.status_home')}
              </span>
            </HStack>

            {!activeTrip && (
              <Box
                as="span"
                px="3"
                py="1"
                borderRadius="full"
                fontSize="xs"
                fontWeight="bold"
                fontVariantNumeric="tabular-nums"
                style={{
                  backgroundColor: 'rgba(255, 122, 0, 0.2)',
                  color: '#fdba74',
                  border: '1px solid rgba(255, 122, 0, 0.4)'
                }}
              >
                {daysUntil === 0
                  ? t('hero.departing_today')
                  : daysUntil === 1
                    ? t('hero.departing_tomorrow')
                    : t('hero.next_trip_in', { days: daysUntil })}
              </Box>
            )}
          </HStack>

          <Box
            as="span"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="wider"
            style={{ color: '#38bdf8' }}
          >
            {activeTrip ? t('hero.active_trip_label') : t('hero.next_trip_label')}
          </Box>
        </Flex>

        <Grid gridTemplateColumns={{ base: '1fr', lg: '7fr 5fr' }} gap="4" alignItems="start">
          <Stack gap="3">
            <Stack gap="1">
              <HStack gap="2" alignItems="center" flexWrap="wrap">
                <Box
                  textStyle="display"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="black"
                  style={{
                    background: 'linear-gradient(90deg, #ff87b8 0%, #ffb86c 50%, #38bdf8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {spotlightTrip.title}
                </Box>
                <Box
                  as="span"
                  px="2.5"
                  py="0.5"
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="bold"
                  style={{
                    backgroundColor: 'rgba(0, 160, 224, 0.2)',
                    color: '#38bdf8'
                  }}
                >
                  {spotlightTrip.primaryRegion}
                </Box>
              </HStack>

              <HStack gap="3" fontSize="xs" color="fg.muted" flexWrap="wrap">
                <HStack gap="1">
                  <FaCalendarCheck size={12} style={{ color: '#e4007f' }} />
                  <Box as="span" fontVariantNumeric="tabular-nums" fontWeight="semibold">
                    {spotlightTrip.startDate} → {spotlightTrip.endDate} (
                    {t('trips.days_count', { count: spotlightTrip.durationDays })})
                  </Box>
                </HStack>
                <HStack gap="1">
                  <FaLocationDot size={12} style={{ color: '#00a0e0' }} />
                  <Box as="span">Route: {spotlightTrip.airports.join(' ✈ ')}</Box>
                </HStack>
              </HStack>
            </Stack>

            <Stack gap="2">
              {spotlightTrip.flights.map((flight) => (
                <FlightLegRow key={flight.id} flight={flight} compact />
              ))}
            </Stack>
          </Stack>

          <Stack gap="2.5">
            <HStack justify="space-between" alignItems="center">
              <HStack gap="1.5" fontSize="xs" fontWeight="bold" style={{ color: '#ff87b8' }}>
                <FaMicrophoneLines size={12} />
                <span>
                  {t('hero.events_on_trip', { count: spotlightTrip.events.length })}
                </span>
              </HStack>
              <button
                type="button"
                onClick={() => onSelectTrip(spotlightTrip)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: 'rgba(228, 0, 127, 0.25)',
                  color: '#ffd0e0',
                  border: '1px solid rgba(228, 0, 127, 0.5)'
                }}
              >
                {t('hero.view_trip_details')}
              </button>
            </HStack>

            {spotlightTrip.events.length === 0 ? (
              <Box
                p="3"
                borderRadius="lg"
                fontSize="xs"
                color="fg.muted"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px dashed rgba(255,255,255,0.15)'
                }}
              >
                {t('hero.no_events_logged')}
              </Box>
            ) : (
              <Stack gap="2" maxH="320px" overflowY="auto">
                {spotlightTrip.events.map((ev) => (
                  <EventernoteCard key={ev.id} event={ev} compact />
                ))}
              </Stack>
            )}
          </Stack>
        </Grid>

        {nextQueue.length > 0 && (
          <Stack
            gap="2"
            pt="3"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}
          >
            <Box fontSize="2xs" fontWeight="bold" color="fg.muted" letterSpacing="wider">
              ON DECK AFTER THIS TRIP
            </Box>
            <Grid gridTemplateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap="2.5">
              {nextQueue.map((tr) => (
                <Box
                  key={tr.id}
                  {...clickable(() => onSelectTrip(tr), tr.title)}
                  cursor="pointer"
                  p="2.5"
                  borderRadius="lg"
                  style={{
                    backgroundColor: 'rgba(23, 14, 17, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                >
                  <Stack gap="1">
                    <Flex justify="space-between" align="center" gap="1">
                      <Box
                        as="span"
                        fontSize="2xs"
                        fontWeight="bold"
                        fontVariantNumeric="tabular-nums"
                        style={{ color: '#38bdf8' }}
                      >
                        {tr.startDate} → {tr.endDate}
                      </Box>
                      {tr.events.length > 0 && (
                        <Box
                          as="span"
                          px="1.5"
                          py="0.5"
                          borderRadius="full"
                          fontSize="2xs"
                          fontWeight="bold"
                          style={{
                            backgroundColor: 'rgba(228, 0, 127, 0.25)',
                            color: '#ff87b8'
                          }}
                        >
                          🎤 {tr.events.length}
                        </Box>
                      )}
                    </Flex>
                    <Box fontSize="xs" fontWeight="bold">
                      {tr.title}
                    </Box>
                    <Box fontSize="2xs" color="fg.muted">
                      {tr.flights.map((f) => `${f.airline_iata}${f.flight_number}`).join(' · ')} (
                      {tr.airports.join('→')})
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Grid>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
