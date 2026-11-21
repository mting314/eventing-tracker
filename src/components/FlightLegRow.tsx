import { FaChair, FaClock, FaPlane, FaRoute } from 'react-icons/fa6';
import { Box, Flex, Grid, HStack, Stack } from 'styled-system/jsx';
import type { PublicFlightRecord } from '~/types';
import { formatLocalTime } from '~/utils/trip-cluster';

export function FlightLegRow({
  flight,
  compact = false
}: {
  flight: PublicFlightRecord;
  compact?: boolean;
}) {
  const code = `${flight.airline_iata}${flight.flight_number}`;
  const depLocal = formatLocalTime(
    flight.departureScheduleGateActual ??
      flight.departureScheduleGateEstimated ??
      flight.departureScheduleGateOriginal,
    flight.departure_timezone
  );
  const arrLocal = formatLocalTime(
    flight.arrivalScheduleGateActual ??
      flight.arrivalScheduleGateEstimated ??
      flight.arrivalScheduleGateOriginal,
    flight.arrival_timezone
  );

  const onTimePct =
    flight.delay_forecast_observations && flight.delay_forecast_observations > 0
      ? Math.round(
          (((flight.delayForecastEarlyCount ?? 0) + (flight.delayForecastOntimeCount ?? 0)) /
            flight.delay_forecast_observations) *
            100
        )
      : null;

  return (
    <Box
      borderRadius="lg"
      borderWidth="1px"
      p={compact ? '2.5' : '3'}
      style={{
        borderColor: 'rgba(0, 160, 224, 0.32)',
        backgroundColor: 'rgba(0, 160, 224, 0.06)'
      }}
    >
      <Stack gap="2">
        <Flex justify="space-between" align="center" wrap="wrap" gap="2">
          <HStack gap="2" flexWrap="wrap">
            <HStack
              gap="1.5"
              px="2"
              py="0.5"
              borderRadius="md"
              style={{
                backgroundColor: 'rgba(0, 160, 224, 0.2)',
                color: '#38bdf8'
              }}
            >
              <FaPlane size={12} />
              <Box as="span" fontWeight="bold" fontSize="xs" fontVariantNumeric="tabular-nums">
                {code}
              </Box>
            </HStack>
            <Box as="span" fontSize="xs" fontWeight="semibold">
              {flight.airline_name}
            </Box>
            {flight.aircraft_model && (
              <Box
                as="span"
                fontSize="xs"
                px="1.5"
                py="0.5"
                borderRadius="sm"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: 'var(--colors-fg-muted)'
                }}
              >
                {flight.aircraft_model}
                {flight.tail_number ? ` · ${flight.tail_number}` : ''}
              </Box>
            )}
          </HStack>

          <HStack gap="2" flexWrap="wrap">
            {flight.seat_number && (
              <HStack
                gap="1"
                fontSize="xs"
                px="2"
                py="0.5"
                borderRadius="sm"
                style={{
                  backgroundColor: 'rgba(228, 0, 127, 0.16)',
                  color: '#ff87b8'
                }}
              >
                <FaChair size={11} />
                <Box as="span" fontWeight="semibold">
                  {flight.seat_number}
                  {flight.seat_position ? ` (${flight.seat_position})` : ''}
                  {flight.cabin_class ? ` · ${flight.cabin_class.toUpperCase()}` : ''}
                </Box>
              </HStack>
            )}
            {flight.distance_km != null && (
              <HStack gap="1" fontSize="xs" color="fg.muted">
                <FaRoute size={11} />
                <Box as="span" fontVariantNumeric="tabular-nums">
                  {flight.distance_km.toLocaleString()} km (
                  {Math.round(flight.distance_km * 0.621371).toLocaleString()} mi)
                </Box>
              </HStack>
            )}
          </HStack>
        </Flex>

        <Grid
          gridTemplateColumns={{ base: '1fr', sm: '1fr auto 1fr' }}
          gap="2"
          alignItems="center"
        >
          <Stack gap="0.5">
            <HStack gap="1.5" alignItems="baseline">
              <Box
                as="span"
                fontSize={compact ? 'md' : 'lg'}
                fontWeight="extrabold"
                fontVariantNumeric="tabular-nums"
                style={{ color: '#38bdf8' }}
              >
                {flight.departure_airport_iata}
              </Box>
              <Box as="span" fontSize="xs" fontWeight="medium">
                {flight.departure_city}
              </Box>
              {flight.departure_terminal && (
                <Box as="span" fontSize="2xs" color="fg.muted">
                  T{flight.departure_terminal}
                  {flight.departure_gate ? ` · G${flight.departure_gate}` : ''}
                </Box>
              )}
            </HStack>
            <Box as="span" fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
              {depLocal} ({flight.departure_timezone.split('/')[1]?.replace('_', ' ') ?? 'Local'})
            </Box>
          </Stack>

          <HStack justify="center" color="fg.muted" fontSize="xs" px="2">
            <Box
              style={{
                height: '1px',
                width: '28px',
                backgroundColor: 'rgba(0, 160, 224, 0.4)'
              }}
            />
            <FaPlane size={12} style={{ color: '#00a0e0' }} />
            <Box
              style={{
                height: '1px',
                width: '28px',
                backgroundColor: 'rgba(0, 160, 224, 0.4)'
              }}
            />
          </HStack>

          <Stack gap="0.5" textAlign={{ base: 'left', sm: 'right' }}>
            <HStack
              gap="1.5"
              alignItems="baseline"
              justifyContent={{ base: 'flex-start', sm: 'flex-end' }}
            >
              <Box
                as="span"
                fontSize={compact ? 'md' : 'lg'}
                fontWeight="extrabold"
                fontVariantNumeric="tabular-nums"
                style={{ color: '#38bdf8' }}
              >
                {flight.arrival_airport_iata}
              </Box>
              <Box as="span" fontSize="xs" fontWeight="medium">
                {flight.arrival_city}
              </Box>
              {flight.arrival_terminal && (
                <Box as="span" fontSize="2xs" color="fg.muted">
                  T{flight.arrival_terminal}
                  {flight.arrival_gate ? ` · G${flight.arrival_gate}` : ''}
                </Box>
              )}
            </HStack>
            <Box as="span" fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
              {arrLocal} ({flight.arrival_timezone.split('/')[1]?.replace('_', ' ') ?? 'Local'})
            </Box>
          </Stack>
        </Grid>

        {!compact && (onTimePct !== null || flight.arrival_weather) && (
          <HStack gap="3" fontSize="2xs" color="fg.muted" flexWrap="wrap">
            {onTimePct !== null && (
              <HStack gap="1">
                <FaClock size={10} />
                <Box as="span">
                  Flighty reliability: {onTimePct}% early/on-time ({flight.delay_forecast_observations}{' '}
                  obs
                  {flight.delay_forecast_mean_min
                    ? `, avg delay ${flight.delay_forecast_mean_min}m`
                    : ''}
                  )
                </Box>
              </HStack>
            )}
            {flight.arrival_weather && (
              <Box as="span">
                Arrival weather: {flight.arrival_weather}
                {flight.arrival_temp_c != null ? ` (${flight.arrival_temp_c}°C)` : ''}
              </Box>
            )}
          </HStack>
        )}
      </Stack>
    </Box>
  );
}
