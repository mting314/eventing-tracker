import { useMemo, useState } from 'react';
import {
  FaArrowUpRightFromSquare,
  FaGrip,
  FaMagnifyingGlass,
  FaTableList
} from 'react-icons/fa6';
import { Box, Flex, Grid, HStack, Stack } from 'styled-system/jsx';
import type { EventernoteEvent, Trip } from '~/types';
import { clickable } from '~/utils/clickable';
import { EventernoteCard } from './EventernoteCard';

export function AllEventsView({
  events,
  trips,
  todayStr,
  onSelectTrip
}: {
  events: EventernoteEvent[];
  trips: Trip[];
  todayStr: string;
  onSelectTrip: (trip: Trip) => void;
}) {
  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [scope, setScope] = useState<'all' | 'upcoming' | 'past'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const tripByEventId = useMemo(() => {
    const map = new Map<string, Trip>();
    for (const tr of trips) {
      for (const ev of tr.events) {
        map.set(ev.id, tr);
      }
    }
    return map;
  }, [trips]);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      if (ev.date.length >= 4) set.add(ev.date.slice(0, 4));
    }
    return [...set].sort().reverse();
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      if (yearFilter !== 'all' && !ev.date.startsWith(yearFilter)) return false;
      if (scope === 'upcoming' && ev.date < todayStr) return false;
      if (scope === 'past' && ev.date >= todayStr) return false;
      if (!q) return true;
      const trip = tripByEventId.get(ev.id);
      const haystack = [
        ev.name,
        ev.place,
        ev.date,
        ...ev.artists,
        trip?.primaryRegion ?? '',
        trip?.title ?? ''
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [events, yearFilter, scope, todayStr, query, tripByEventId]);

  return (
    <Stack gap="4">
      <Flex justify="space-between" align="center" wrap="wrap" gap="3">
        <HStack gap="2" flexWrap="wrap">
          {(['all', 'upcoming', 'past'] as const).map((s) => {
            const active = scope === s;
            const label =
              s === 'all'
                ? `All (${events.length})`
                : s === 'upcoming'
                  ? `Upcoming (${events.filter((e) => e.date >= todayStr).length})`
                  : `Past (${events.filter((e) => e.date < todayStr).length})`;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: active ? '#e4007f' : 'rgba(255, 255, 255, 0.06)',
                  color: active ? '#fff' : 'rgba(255, 255, 255, 0.78)',
                  border: active
                    ? '1px solid #ff87b8'
                    : '1px solid rgba(255, 255, 255, 0.14)'
                }}
              >
                {label}
              </button>
            );
          })}

          <select
            aria-label="Filter by Year"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#211217',
              color: '#ffd0e0',
              border: '1px solid rgba(228, 0, 127, 0.4)'
            }}
          >
            <option value="all">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </HStack>

        <HStack gap="2.5" flex="1" justify="flex-end" flexWrap="wrap">
          <Box position="relative" flex="1" minW="240px" maxW="380px">
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
              placeholder="Search event, venue, or seiyuu / unit..."
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

          <HStack
            gap="1"
            p="1"
            borderRadius="lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <button
              type="button"
              aria-label="Cards view"
              onClick={() => setViewMode('cards')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor:
                  viewMode === 'cards' ? 'rgba(228, 0, 127, 0.3)' : 'transparent',
                color: viewMode === 'cards' ? '#ff87b8' : 'rgba(255,255,255,0.65)',
                border: 'none'
              }}
            >
              <FaGrip size={14} />
            </button>
            <button
              type="button"
              aria-label="Table view"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor:
                  viewMode === 'table' ? 'rgba(228, 0, 127, 0.3)' : 'transparent',
                color: viewMode === 'table' ? '#ff87b8' : 'rgba(255,255,255,0.65)',
                border: 'none'
              }}
            >
              <FaTableList size={14} />
            </button>
          </HStack>
        </HStack>
      </Flex>

      {viewMode === 'cards' ? (
        <Grid gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="3">
          {filtered.map((ev) => {
            const trip = tripByEventId.get(ev.id);
            return (
              <EventernoteCard
                key={ev.id}
                event={ev}
                tripBadge={
                  trip
                    ? `${trip.primaryRegion} (${trip.flights.map((f) => `${f.airline_iata}${f.flight_number}`).join('/')})`
                    : undefined
                }
              />
            );
          })}
        </Grid>
      ) : (
        <Box
          overflowX="auto"
          borderRadius="xl"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  textAlign: 'left'
                }}
              >
                <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ padding: '10px 12px' }}>Event Name</th>
                <th style={{ padding: '10px 12px' }}>Venue (会場)</th>
                <th style={{ padding: '10px 12px' }}>Connected Flighty Trip</th>
                <th style={{ padding: '10px 12px' }}>Cast</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev, idx) => {
                const trip = tripByEventId.get(ev.id);
                return (
                  <tr
                    key={ev.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      backgroundColor:
                        idx % 2 === 1 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 12px',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                        color: '#ff87b8',
                        fontWeight: 600
                      }}
                    >
                      {ev.date} ({ev.dayOfWeek})
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'inherit',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          gap: '6px'
                        }}
                      >
                        <span>{ev.name}</span>
                        <FaArrowUpRightFromSquare size={10} style={{ color: '#ff87b8' }} />
                      </a>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.75)' }}>
                      {ev.place}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {trip ? (
                        <Box
                          as="span"
                          {...clickable(() => onSelectTrip(trip), trip.title)}
                          cursor="pointer"
                          px="2"
                          py="0.5"
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="semibold"
                          style={{
                            backgroundColor: 'rgba(0, 160, 224, 0.18)',
                            color: '#38bdf8',
                            display: 'inline-block'
                          }}
                        >
                          ✈️ {trip.primaryRegion}
                        </Box>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.35)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px' }}>
                      {ev.artists.slice(0, 4).join(', ')}
                      {ev.artists.length > 4 ? ` +${ev.artists.length - 4}` : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      )}
    </Stack>
  );
}
