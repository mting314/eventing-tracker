import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaChevronLeft,
  FaChevronRight,
  FaMicrophoneLines,
  FaPlane
} from 'react-icons/fa6';
import { Box, Flex, Grid, HStack, Stack } from 'styled-system/jsx';
import type { EventernoteEvent, PublicFlightRecord, Trip } from '~/types';
import { clickable } from '~/utils/clickable';
import { toLocalDateString } from '~/utils/trip-cluster';
import { EventernoteCard } from './EventernoteCard';
import { FlightLegRow } from './FlightLegRow';

const pad = (n: number) => String(n).padStart(2, '0');

export function MonthCalendarView({
  trips,
  events,
  flights,
  todayStr,
  onSelectTrip
}: {
  trips: Trip[];
  events: EventernoteEvent[];
  flights: PublicFlightRecord[];
  todayStr: string;
  onSelectTrip: (trip: Trip) => void;
}) {
  const { t, i18n } = useTranslation();

  const initialDate = useMemo(() => {
    const [y, m] = todayStr.split('-').map(Number);
    return { year: y ?? 2026, month: (m ?? 11) - 1 };
  }, [todayStr]);

  const [year, setYear] = useState(initialDate.year);
  const [month, setMonth] = useState(initialDate.month);
  const [selectedDay, setSelectedDay] = useState<string | undefined>();

  const monthPrefix = `${year}-${pad(month + 1)}`;

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    for (const tr of trips) {
      set.add(tr.startDate.slice(0, 4));
      set.add(tr.endDate.slice(0, 4));
    }
    for (const ev of events) {
      if (ev.date.length >= 4) set.add(ev.date.slice(0, 4));
    }
    return [...set].filter((y) => /^\d{4}$/.test(y)).sort().reverse();
  }, [trips, events]);

  // Index trips by day
  const tripsByDay = useMemo(() => {
    const map = new Map<string, Trip[]>();
    const daysInM = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInM; d++) {
      const dayStr = `${monthPrefix}-${pad(d)}`;
      const matching = trips.filter((tr) => tr.startDate <= dayStr && dayStr <= tr.endDate);
      if (matching.length > 0) map.set(dayStr, matching);
    }
    return map;
  }, [trips, year, month, monthPrefix]);

  // Index events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventernoteEvent[]>();
    for (const ev of events) {
      if (ev.date.startsWith(monthPrefix)) {
        map.set(ev.date, [...(map.get(ev.date) ?? []), ev]);
      }
    }
    return map;
  }, [events, monthPrefix]);

  // Index flights by local departure or arrival date
  const flightsByDay = useMemo(() => {
    const map = new Map<string, PublicFlightRecord[]>();
    for (const f of flights) {
      if (f.is_cancelled) continue;
      const depDate = toLocalDateString(
        f.departureScheduleGateOriginal,
        f.departure_timezone
      );
      const arrDate = toLocalDateString(
        f.arrivalScheduleGateOriginal,
        f.arrival_timezone
      );
      if (depDate.startsWith(monthPrefix)) {
        const list = map.get(depDate) ?? [];
        if (!list.some((x) => x.id === f.id)) map.set(depDate, [...list, f]);
      }
      if (arrDate.startsWith(monthPrefix) && arrDate !== depDate) {
        const list = map.get(arrDate) ?? [];
        if (!list.some((x) => x.id === f.id)) map.set(arrDate, [...list, f]);
      }
    }
    return map;
  }, [flights, monthPrefix]);

  // Map eventId -> Trip for badge display
  const tripByEventId = useMemo(() => {
    const map = new Map<string, Trip>();
    for (const tr of trips) {
      for (const ev of tr.events) {
        map.set(ev.id, tr);
      }
    }
    return map;
  }, [trips]);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${monthPrefix}-${pad(i + 1)}`)
  ];

  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((d) =>
    new Date(2024, 8, 1 + d).toLocaleDateString(i18n.language, { weekday: 'short' })
  );
  const monthLabel = new Date(year, month, 1).toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'long'
  });

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setSelectedDay(undefined);
  };

  // Agenda items for selectedDay or entire month
  const agendaTrips = useMemo(() => {
    if (selectedDay) return tripsByDay.get(selectedDay) ?? [];
    const seen = new Set<string>();
    const list: Trip[] = [];
    for (const dayTrips of tripsByDay.values()) {
      for (const tr of dayTrips) {
        if (!seen.has(tr.id)) {
          seen.add(tr.id);
          list.push(tr);
        }
      }
    }
    return list.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [selectedDay, tripsByDay]);

  const agendaFlights = useMemo(() => {
    if (selectedDay) return flightsByDay.get(selectedDay) ?? [];
    const seen = new Set<string>();
    const list: PublicFlightRecord[] = [];
    for (const dayFlights of flightsByDay.values()) {
      for (const f of dayFlights) {
        if (!seen.has(f.id)) {
          seen.add(f.id);
          list.push(f);
        }
      }
    }
    return list.sort((a, b) =>
      (a.departureScheduleGateOriginal ?? '').localeCompare(
        b.departureScheduleGateOriginal ?? ''
      )
    );
  }, [selectedDay, flightsByDay]);

  const agendaEvents = useMemo(() => {
    if (selectedDay) return eventsByDay.get(selectedDay) ?? [];
    const list: EventernoteEvent[] = [];
    for (const dayEvents of eventsByDay.values()) {
      list.push(...dayEvents);
    }
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedDay, eventsByDay]);

  return (
    <Grid gap="5" alignItems="start" gridTemplateColumns={{ base: '1fr', lg: '7fr 5fr' }}>
      {/* Month Calendar Grid */}
      <Stack gap="3">
        <Flex
          justify="space-between"
          align="center"
          p="2.5"
          borderRadius="lg"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <button
            type="button"
            aria-label={t('calendar.prev_month')}
            onClick={() => changeMonth(-1)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: 'inherit',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <FaChevronLeft size={13} />
          </button>

          <HStack gap="2" flexWrap="wrap" justify="center">
            <Box textStyle="display" fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">
              {monthLabel}
            </Box>
            <select
              aria-label="Select Year"
              value={String(year)}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setSelectedDay(undefined);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: '#211217',
                color: '#ffd0e0',
                border: '1px solid rgba(228, 0, 127, 0.4)'
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setYear(initialDate.year);
                setMonth(initialDate.month);
                setSelectedDay(undefined);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: 'rgba(228, 0, 127, 0.2)',
                color: '#ff87b8',
                border: '1px solid rgba(228, 0, 127, 0.45)'
              }}
            >
              {t('calendar.today')}
            </button>
          </HStack>

          <button
            type="button"
            aria-label={t('calendar.next_month')}
            onClick={() => changeMonth(1)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: 'inherit',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <FaChevronRight size={13} />
          </button>
        </Flex>

        <Grid gap="1.5" gridTemplateColumns="repeat(7, minmax(0, 1fr))">
          {weekdays.map((d) => (
            <Box
              key={d}
              color="fg.muted"
              fontSize="xs"
              fontWeight="bold"
              textAlign="center"
              py="1"
            >
              {d}
            </Box>
          ))}

          {cells.map((day, idx) => {
            if (!day) {
              return <Box key={`empty-${idx}`} minH={{ base: '16', md: '24' }} opacity="0" />;
            }

            const dayTrips = tripsByDay.get(day) ?? [];
            const dayEvents = eventsByDay.get(day) ?? [];
            const dayFlights = flightsByDay.get(day) ?? [];
            const hasActivity =
              dayTrips.length > 0 || dayEvents.length > 0 || dayFlights.length > 0;
            const isToday = day === todayStr;
            const isSelected = day === selectedDay;
            const primaryTrip = dayTrips[0];

            return (
              <Box
                key={day}
                {...clickable(
                  () => setSelectedDay(isSelected ? undefined : day),
                  `${day} (${dayEvents.length} events, ${dayFlights.length} flights)`
                )}
                cursor="pointer"
                minH={{ base: '16', md: '24' }}
                p="1.5"
                borderRadius="lg"
                position="relative"
                overflow="hidden"
                style={{
                  borderWidth: isSelected || isToday ? '2px' : '1px',
                  borderStyle: 'solid',
                  borderColor: isSelected
                    ? '#e4007f'
                    : isToday
                      ? '#ff7a00'
                      : hasActivity
                        ? 'rgba(255, 255, 255, 0.18)'
                        : 'rgba(255, 255, 255, 0.07)',
                  backgroundColor: isSelected
                    ? 'rgba(228, 0, 127, 0.16)'
                    : primaryTrip
                      ? primaryTrip.isEventingTrip
                        ? 'rgba(228, 0, 127, 0.08)'
                        : 'rgba(0, 160, 224, 0.08)'
                      : hasActivity
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(255, 255, 255, 0.015)'
                }}
              >
                {/* Trip Span Top Bar */}
                {primaryTrip && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      backgroundColor: primaryTrip.isEventingTrip ? '#e4007f' : '#00a0e0'
                    }}
                  />
                )}

                <Stack gap="1" pt="0.5">
                  <Flex justify="space-between" align="center">
                    <Box
                      as="span"
                      fontSize="xs"
                      fontWeight={isToday || hasActivity ? 'bold' : 'normal'}
                      fontVariantNumeric="tabular-nums"
                      style={{
                        color: isToday
                          ? '#ff7a00'
                          : isSelected
                            ? '#ff87b8'
                            : hasActivity
                              ? '#fff'
                              : 'rgba(255,255,255,0.45)'
                      }}
                    >
                      {Number(day.slice(8))}
                    </Box>

                    {dayFlights.length > 0 && (
                      <HStack
                        gap="0.5"
                        px="1"
                        py="0.2"
                        borderRadius="sm"
                        fontSize="2xs"
                        fontWeight="bold"
                        style={{
                          backgroundColor: 'rgba(0, 160, 224, 0.25)',
                          color: '#38bdf8'
                        }}
                      >
                        <FaPlane size={8} />
                        <span>{dayFlights.length}</span>
                      </HStack>
                    )}
                  </Flex>

                  {primaryTrip && (day === primaryTrip.startDate || idx % 7 === 0) && (
                    <Box
                      fontSize="2xs"
                      fontWeight="bold"
                      px="1"
                      py="0.2"
                      borderRadius="sm"
                      style={{
                        backgroundColor: primaryTrip.isEventingTrip
                          ? 'rgba(228, 0, 127, 0.24)'
                          : 'rgba(0, 160, 224, 0.22)',
                        color: primaryTrip.isEventingTrip ? '#ffd0e0' : '#bae6fd',
                        lineHeight: 1.2,
                        wordBreak: 'break-word'
                      }}
                    >
                      {primaryTrip.cities.slice(0, 2).join('·')}
                    </Box>
                  )}

                  {dayFlights.slice(0, 1).map((f) => (
                    <Box
                      key={f.id}
                      fontSize="2xs"
                      fontWeight="semibold"
                      fontVariantNumeric="tabular-nums"
                      style={{ color: '#38bdf8', lineHeight: 1.15 }}
                    >
                      {f.airline_iata}
                      {f.flight_number} {f.departure_airport_iata}→{f.arrival_airport_iata}
                    </Box>
                  ))}

                  {dayEvents.length > 0 && (
                    <HStack gap="1" flexWrap="wrap" alignItems="center">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <Box
                          key={ev.id}
                          title={ev.name}
                          w="2"
                          h="2"
                          borderRadius="full"
                          style={{ backgroundColor: '#e4007f' }}
                        />
                      ))}
                      <Box
                        as="span"
                        fontSize="2xs"
                        fontWeight="bold"
                        style={{ color: '#ff87b8' }}
                      >
                        🎤{dayEvents.length}
                      </Box>
                    </HStack>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Grid>

        {/* Legend */}
        <HStack gap="4" pt="1" flexWrap="wrap" fontSize="xs" color="fg.muted">
          <HStack gap="1.5">
            <Box w="3" h="1.5" borderRadius="full" style={{ backgroundColor: '#e4007f' }} />
            <span>{t('calendar.legend_eventing_trip')}</span>
          </HStack>
          <HStack gap="1.5">
            <Box w="3" h="1.5" borderRadius="full" style={{ backgroundColor: '#00a0e0' }} />
            <span>{t('calendar.legend_travel_trip')}</span>
          </HStack>
          <HStack gap="1.5">
            <FaPlane size={11} style={{ color: '#38bdf8' }} />
            <span>{t('calendar.legend_flight_day')}</span>
          </HStack>
          <HStack gap="1.5">
            <Box w="2" h="2" borderRadius="full" style={{ backgroundColor: '#e4007f' }} />
            <span>{t('calendar.legend_event_day')}</span>
          </HStack>
        </HStack>
      </Stack>

      {/* Side Agenda Panel */}
      <Stack
        gap="3"
        p="4"
        borderRadius="xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="2">
          <Box textStyle="display" fontSize="md" fontWeight="bold">
            {t('calendar.agenda_title', { label: selectedDay ?? monthLabel })}
          </Box>
          {selectedDay && (
            <button
              type="button"
              onClick={() => setSelectedDay(undefined)}
              style={{
                padding: '3px 9px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffd0e0',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              {t('calendar.clear_day')}
            </button>
          )}
        </Flex>

        {agendaTrips.length === 0 && agendaFlights.length === 0 && agendaEvents.length === 0 && (
          <Box py="8" textAlign="center" color="fg.muted" fontSize="sm">
            {t('calendar.no_activity')}
          </Box>
        )}

        <Stack gap="3" maxH="72vh" overflowY="auto">
          {/* Trips in window */}
          {agendaTrips.length > 0 && (
            <Stack gap="2">
              <Box fontSize="xs" fontWeight="bold" color="fg.muted" letterSpacing="wider">
                TRIPS IN WINDOW ({agendaTrips.length})
              </Box>
              {agendaTrips.map((tr) => (
                <Box
                  key={tr.id}
                  {...clickable(() => onSelectTrip(tr), tr.title)}
                  cursor="pointer"
                  p="3"
                  borderRadius="lg"
                  style={{
                    backgroundColor: tr.isEventingTrip
                      ? 'rgba(228, 0, 127, 0.12)'
                      : 'rgba(0, 160, 224, 0.1)',
                    border: tr.isEventingTrip
                      ? '1px solid rgba(228, 0, 127, 0.4)'
                      : '1px solid rgba(0, 160, 224, 0.35)'
                  }}
                >
                  <Flex justify="space-between" align="center" wrap="wrap" gap="2">
                    <Stack gap="0.5">
                      <HStack gap="2" flexWrap="wrap">
                        <Box fontWeight="bold" fontSize="sm">
                          {tr.title}
                        </Box>
                        <Box
                          as="span"
                          px="2"
                          py="0.5"
                          borderRadius="full"
                          fontSize="2xs"
                          fontWeight="bold"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.35)',
                            color: tr.isEventingTrip ? '#ff87b8' : '#38bdf8'
                          }}
                        >
                          {tr.primaryRegion}
                        </Box>
                      </HStack>
                      <Box fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
                        {tr.startDate} → {tr.endDate} · {tr.flights.length} flights ·{' '}
                        {tr.events.length} events
                      </Box>
                    </Stack>
                    <Box
                      as="span"
                      fontSize="xs"
                      fontWeight="bold"
                      style={{ color: '#ff87b8' }}
                    >
                      Inspect →
                    </Box>
                  </Flex>
                </Box>
              ))}
            </Stack>
          )}

          {/* Eventernote Events in window */}
          {agendaEvents.length > 0 && (
            <Stack gap="2">
              <HStack gap="1.5" fontSize="xs" fontWeight="bold" style={{ color: '#ff87b8' }}>
                <FaMicrophoneLines size={12} />
                <span>EVENTERNOTE EVENTS ({agendaEvents.length})</span>
              </HStack>
              {agendaEvents.map((ev) => (
                <EventernoteCard
                  key={ev.id}
                  event={ev}
                  tripBadge={tripByEventId.get(ev.id)?.primaryRegion}
                  compact
                />
              ))}
            </Stack>
          )}

          {/* Flights in window */}
          {agendaFlights.length > 0 && (
            <Stack gap="2">
              <HStack gap="1.5" fontSize="xs" fontWeight="bold" style={{ color: '#38bdf8' }}>
                <FaPlane size={12} />
                <span>FLIGHTY LEGS ({agendaFlights.length})</span>
              </HStack>
              {agendaFlights.map((f) => (
                <FlightLegRow key={f.id} flight={f} compact />
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Grid>
  );
}
