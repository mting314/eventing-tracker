import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCalendarDays, FaMicrophoneLines, FaPlane, FaRoute, FaXmark } from 'react-icons/fa6';
import { Box, Flex, HStack, Stack } from 'styled-system/jsx';
import type { Trip } from '~/types';
import { EventernoteCard } from './EventernoteCard';
import { FlightLegRow } from './FlightLegRow';

export function TripDetailModal({
  trip,
  onClose
}: {
  trip: Trip | null;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isJa = i18n.language.startsWith('ja');

  useEffect(() => {
    if (!trip) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [trip, onClose]);

  if (!trip) return null;

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={trip.title}
      onClick={onClose}
      position="fixed"
      inset="0"
      zIndex="100"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={{ base: '3', md: '6' }}
      style={{
        backgroundColor: 'rgba(10, 6, 9, 0.82)',
        backdropFilter: 'blur(6px)'
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        w="full"
        maxW="3xl"
        maxH="88vh"
        overflowY="auto"
        borderRadius="xl"
        p={{ base: '4', md: '6' }}
        style={{
          backgroundColor: '#1d1116',
          border: '1px solid rgba(228, 0, 127, 0.45)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)'
        }}
      >
        <Stack gap="4">
          <Flex justify="space-between" align="flex-start" gap="3">
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
                    backgroundColor: trip.isEventingTrip
                      ? 'rgba(228, 0, 127, 0.25)'
                      : 'rgba(0, 160, 224, 0.22)',
                    color: trip.isEventingTrip ? '#ff87b8' : '#38bdf8'
                  }}
                >
                  {trip.primaryRegion}
                </Box>
                <Box
                  as="span"
                  fontSize="xs"
                  color="fg.muted"
                  fontVariantNumeric="tabular-nums"
                >
                  <FaCalendarDays
                    size={11}
                    style={{ display: 'inline', marginRight: '5px', color: '#e4007f' }}
                  />
                  {trip.startDate} → {trip.endDate} (
                  {t('trips.days_count', { count: trip.durationDays })})
                </Box>
              </HStack>
              <Box textStyle="display" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="black">
                {isJa ? trip.title : (trip.titleEn ?? trip.title)}
              </Box>
              <HStack gap="3" fontSize="xs" color="fg.muted" flexWrap="wrap">
                <HStack gap="1">
                  <FaPlane size={11} style={{ color: '#38bdf8' }} />
                  <span>Route: {trip.airports.join(' ✈ ')}</span>
                </HStack>
                {trip.totalDistanceKm > 0 && (
                  <HStack gap="1">
                    <FaRoute size={11} style={{ color: '#ff7a00' }} />
                    <span>
                      {trip.totalDistanceKm.toLocaleString()} km (
                      {Math.round(trip.totalDistanceKm * 0.621371).toLocaleString()} mi)
                    </span>
                  </HStack>
                )}
              </HStack>
            </Stack>

            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              style={{
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <FaXmark size={16} />
            </button>
          </Flex>

          <Stack gap="2.5">
            <HStack gap="2" fontSize="sm" fontWeight="bold" style={{ color: '#38bdf8' }}>
              <FaPlane size={13} />
              <span>
                {t('trips.telemetry_heading')} ({trip.flights.length})
              </span>
            </HStack>
            <Stack gap="2">
              {trip.flights.map((f) => (
                <FlightLegRow key={f.id} flight={f} />
              ))}
            </Stack>
          </Stack>

          <Stack gap="2.5">
            <HStack gap="2" fontSize="sm" fontWeight="bold" style={{ color: '#ff87b8' }}>
              <FaMicrophoneLines size={13} />
              <span>
                {t('trips.events_heading')} ({trip.events.length})
              </span>
            </HStack>
            {trip.events.length === 0 ? (
              <Box
                p="3"
                borderRadius="lg"
                fontSize="xs"
                color="fg.muted"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(255,255,255,0.15)'
                }}
              >
                {t('hero.no_events_logged')}
              </Box>
            ) : (
              <Stack gap="2">
                {trip.events.map((ev) => (
                  <EventernoteCard key={ev.id} event={ev} />
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
