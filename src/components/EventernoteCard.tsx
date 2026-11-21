import { useState } from 'react';
import { FaArrowUpRightFromSquare, FaLocationDot, FaMicrophoneLines } from 'react-icons/fa6';
import { Box, Flex, HStack, Stack } from 'styled-system/jsx';
import type { EventernoteEvent } from '~/types';

export function EventernoteCard({
  event,
  tripBadge,
  compact = false
}: {
  event: EventernoteEvent;
  tripBadge?: string;
  compact?: boolean;
}) {
  const [expandedArtists, setExpandedArtists] = useState(false);
  const maxArtists = compact ? 6 : 12;
  const visibleArtists = expandedArtists ? event.artists : event.artists.slice(0, maxArtists);
  const remainingCount = event.artists.length - visibleArtists.length;

  return (
    <Box
      borderRadius="lg"
      borderWidth="1px"
      p={compact ? '2.5' : '3.5'}
      style={{
        borderColor: 'rgba(228, 0, 127, 0.35)',
        backgroundColor: 'rgba(228, 0, 127, 0.07)'
      }}
    >
      <Stack gap="2">
        <Flex justify="space-between" align="flex-start" gap="2" wrap="wrap">
          <HStack gap="2" flexWrap="wrap">
            <Box
              as="span"
              px="2"
              py="0.5"
              borderRadius="md"
              fontSize="xs"
              fontWeight="bold"
              fontVariantNumeric="tabular-nums"
              style={{
                backgroundColor: 'rgba(228, 0, 127, 0.22)',
                color: '#ff87b8'
              }}
            >
              {event.date}
              {event.dayOfWeek ? ` (${event.dayOfWeek})` : ''}
            </Box>
            {tripBadge && (
              <Box
                as="span"
                px="2"
                py="0.5"
                borderRadius="md"
                fontSize="2xs"
                fontWeight="semibold"
                style={{
                  backgroundColor: 'rgba(0, 160, 224, 0.18)',
                  color: '#38bdf8'
                }}
              >
                ✈️ {tripBadge}
              </Box>
            )}
          </HStack>

          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#ff87b8',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            <span>Eventernote</span>
            <FaArrowUpRightFromSquare size={10} />
          </a>
        </Flex>

        {/* Rule 1 from LLerNote: Wrap, never truncate event names with ellipsis */}
        <Box
          fontWeight="bold"
          fontSize={compact ? 'sm' : 'md'}
          lineHeight="1.4"
          style={{ wordBreak: 'break-word' }}
        >
          {event.name}
        </Box>

        {event.place && (
          <HStack gap="1.5" fontSize="xs" color="fg.muted" alignItems="center">
            <FaLocationDot size={12} style={{ color: '#e4007f', flexShrink: 0 }} />
            <Box as="span" style={{ wordBreak: 'break-word' }}>
              {event.place}
            </Box>
          </HStack>
        )}

        {event.artists.length > 0 && (
          <HStack gap="1.5" flexWrap="wrap" alignItems="center">
            <FaMicrophoneLines size={11} style={{ color: '#ff7a00', flexShrink: 0 }} />
            {visibleArtists.map((artist) => (
              <Box
                key={artist}
                as="span"
                px="2"
                py="0.5"
                borderRadius="full"
                fontSize="2xs"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              >
                {artist}
              </Box>
            ))}
            {remainingCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedArtists(true);
                }}
                style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: 'rgba(228, 0, 127, 0.18)',
                  color: '#ff87b8',
                  border: 'none'
                }}
              >
                +{remainingCount} more
              </button>
            )}
          </HStack>
        )}
      </Stack>
    </Box>
  );
}
