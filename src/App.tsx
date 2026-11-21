import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaArrowUpRightFromSquare,
  FaCalendarDays,
  FaCalendarPlus,
  FaChartSimple,
  FaLanguage,
  FaMicrophoneLines,
  FaMoon,
  FaPlaneDeparture,
  FaSun
} from 'react-icons/fa6';
import { Box, Container, Flex, HStack, Stack } from 'styled-system/jsx';
import eventsData from '../data/events.json';
import flightsData from '../data/flights.json';
import tripsData from '../data/trips.json';
import { AllEventsView } from './components/AllEventsView';
import { MonthCalendarView } from './components/MonthCalendarView';
import { StatsView } from './components/StatsView';
import { TripDetailModal } from './components/TripDetailModal';
import { TripsListView } from './components/TripsListView';
import { WhereAmINextBanner } from './components/WhereAmINextBanner';
import type { EventernoteEvent, PublicFlightRecord, Trip } from './types';

type ActiveTab = 'calendar' | 'trips' | 'events' | 'stats';

const trips = tripsData as unknown as Trip[];
const flights = flightsData as unknown as PublicFlightRecord[];
const events = eventsData as unknown as EventernoteEvent[];

export function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [colorMode, setColorMode] = useState<'dark' | 'light'>('dark');
  const [copiedIcs, setCopiedIcs] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const savedTheme = localStorage.getItem('color-mode');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setColorMode(savedTheme);
    }
    const savedLang = localStorage.getItem('i18nextLng');
    if ((savedLang === 'en' || savedLang === 'ja') && savedLang !== i18n.language) {
      void i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  useEffect(() => {
    document.documentElement.classList.remove(colorMode === 'dark' ? 'light' : 'dark');
    document.documentElement.classList.add(colorMode);
    localStorage.setItem('color-mode', colorMode);
  }, [colorMode]);

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('ja') ? 'en' : 'ja';
    void i18n.changeLanguage(next);
    localStorage.setItem('i18nextLng', next);
  };

  const handleCopyIcs = () => {
    const url = new URL('calendar.ics', window.location.href).toString();
    void navigator.clipboard?.writeText(url);
    setCopiedIcs(true);
    setTimeout(() => setCopiedIcs(false), 2200);
  };

  const navTabs: { id: ActiveTab; label: string; icon: typeof FaCalendarDays }[] = [
    { id: 'calendar', label: t('nav.calendar'), icon: FaCalendarDays },
    { id: 'trips', label: t('nav.trips'), icon: FaPlaneDeparture },
    { id: 'events', label: t('nav.events'), icon: FaMicrophoneLines },
    { id: 'stats', label: t('nav.stats'), icon: FaChartSimple }
  ];

  const isDark = colorMode === 'dark';

  return (
    <Box
      position="relative"
      minH="100vh"
      w="full"
      style={{
        backgroundColor: isDark ? '#140b0f' : '#fdf8fa',
        color: isDark ? '#fff7fb' : '#191418'
      }}
    >
      {/* LLerNote Stage-Glow Backdrop */}
      <Box
        position="fixed"
        top="-35%"
        left="50%"
        transform="translateX(-50%)"
        w="140vw"
        h="80vh"
        pointerEvents="none"
        zIndex="0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(228,0,127,0.16) 0%, rgba(255,122,0,0.06) 35%, rgba(0,160,224,0.08) 60%, transparent 75%)'
        }}
      />

      <Container position="relative" zIndex="1" maxW="7xl" px={{ base: '3', md: '6' }} py="5">
        <Stack gap="5">
          {/* Top Navigation Bar */}
          <Flex
            justify="space-between"
            align="center"
            wrap="wrap"
            gap="3"
            pb="3"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            <Stack gap="0.5">
              <HStack gap="2.5" alignItems="center" flexWrap="wrap">
                <Box
                  textStyle="display"
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="black"
                  style={{
                    background: 'linear-gradient(90deg, #e4007f 0%, #ff7a00 50%, #00a0e0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {t('app.title')}
                </Box>
                <a
                  href="https://www.eventernote.com/users/tinmsnake/events"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(228, 0, 127, 0.18)',
                    color: '#ff87b8',
                    textDecoration: 'none',
                    border: '1px solid rgba(228, 0, 127, 0.4)'
                  }}
                >
                  <span>{t('app.eventernote_profile')}</span>
                  <FaArrowUpRightFromSquare size={10} />
                </a>
              </HStack>
              <Box fontSize="xs" color="fg.muted">
                {t('app.subtitle')}
              </Box>
            </Stack>

            <HStack gap="2" flexWrap="wrap">
              <a
                href="./calendar.ics"
                download="tinmsnake-travel-events.ics"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(0, 160, 224, 0.2)',
                  color: '#38bdf8',
                  textDecoration: 'none',
                  border: '1px solid rgba(0, 160, 224, 0.45)'
                }}
              >
                <FaCalendarPlus size={12} />
                <span>{t('app.subscribe_ics')}</span>
              </a>

              <button
                type="button"
                onClick={handleCopyIcs}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'inherit',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                {copiedIcs ? `✓ ${t('app.copied')}` : t('app.copy_ics')}
              </button>

              <button
                type="button"
                aria-label="Toggle language"
                onClick={toggleLanguage}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'inherit',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <FaLanguage size={15} />
                <span>{i18n.language.startsWith('ja') ? 'EN' : '日本語'}</span>
              </button>

              <button
                type="button"
                aria-label="Toggle color mode"
                onClick={() => setColorMode(isDark ? 'light' : 'dark')}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'inherit',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                {isDark ? <FaSun size={13} /> : <FaMoon size={13} />}
              </button>
            </HStack>
          </Flex>

          {/* Hero Banner: "Where Am I Next?" */}
          <WhereAmINextBanner
            trips={trips}
            todayStr={todayStr}
            onSelectTrip={(tr) => setSelectedTrip(tr)}
          />

          {/* Primary Navigation Tabs */}
          <HStack
            gap="2"
            p="1.5"
            borderRadius="xl"
            flexWrap="wrap"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#e4007f' : 'transparent',
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                    border: isActive
                      ? '1px solid #ff87b8'
                      : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </HStack>

          {/* Active View Content */}
          <Box>
            {activeTab === 'calendar' && (
              <MonthCalendarView
                trips={trips}
                events={events}
                flights={flights}
                todayStr={todayStr}
                onSelectTrip={(tr) => setSelectedTrip(tr)}
              />
            )}
            {activeTab === 'trips' && (
              <TripsListView
                trips={trips}
                onSelectTrip={(tr) => setSelectedTrip(tr)}
              />
            )}
            {activeTab === 'events' && (
              <AllEventsView
                events={events}
                trips={trips}
                todayStr={todayStr}
                onSelectTrip={(tr) => setSelectedTrip(tr)}
              />
            )}
            {activeTab === 'stats' && (
              <StatsView trips={trips} flights={flights} events={events} />
            )}
          </Box>
        </Stack>
      </Container>

      <TripDetailModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
    </Box>
  );
}
