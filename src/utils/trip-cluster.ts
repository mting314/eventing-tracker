import type { EventernoteEvent, PublicFlightRecord, Trip, TripOverride } from '../types';
import {
  translateEventNameToEn,
  translateTripTitleToEn,
  translateVenueToEn
} from './translate-ja-en';

const HOME_AIRPORTS = new Set(['SFO', 'SJC', 'OAK']);
const US_GATEWAY_AIRPORTS = new Set(['SFO', 'SJC', 'OAK', 'LAX', 'SEA', 'EWR', 'JFK', 'BUR', 'SAN']);

/** Convert a UTC ISO timestamp into YYYY-MM-DD in a specific IANA timezone. */
export function toLocalDateString(isoUtc: string | null, timeZone: string): string {
  if (!isoUtc) return '';
  try {
    const dt = new Date(isoUtc);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(dt);
  } catch {
    return isoUtc.slice(0, 10);
  }
}

export function formatLocalTime(isoUtc: string | null, timeZone: string): string {
  if (!isoUtc) return '—';
  try {
    const dt = new Date(isoUtc);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(dt);
  } catch {
    return isoUtc.slice(0, 16).replace('T', ' ');
  }
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + delta));
  return dt.toISOString().slice(0, 10);
}

export function daysBetween(startDate: string, endDate: string): number {
  const [y1, m1, d1] = startDate.split('-').map(Number);
  const [y2, m2, d2] = endDate.split('-').map(Number);
  const t1 = Date.UTC(y1!, m1! - 1, d1!);
  const t2 = Date.UTC(y2!, m2! - 1, d2!);
  return Math.max(1, Math.round((t2 - t1) / 86400000) + 1);
}

/**
 * Cleans an individual Eventernote event name into a concise canonical Live / Show title
 * by stripping day/session numbers and shortening verbose franchise prefixes.
 */
export function canonicalizeLiveName(rawName: string): {
  fullLabel: string;
  shortLabel: string;
  groupKey: string;
} {
  let s = rawName
    .replace(/^【[^】]+】\s*/g, '')
    .replace(/^[『「](.+)[』」]$/g, '$1')
    .replace(/[『「]([^』」]+)[』」]/g, ' $1 ')
    .trim();

  // Collapse multi-act BanG Dream! 13th☆LIVE DAY1 : ... into BanG Dream! 13th☆LIVE
  if (/^BanG Dream!\s*\d+th☆LIVE/i.test(s)) {
    const m = /^(BanG Dream!\s*\d+th☆LIVE)/i.exec(s);
    if (m) s = m[1]!;
  }

  // Shorten verbose franchise prefixes to fan-standard names
  s = s
    .replace(/^ラブライブ！蓮ノ空女学院スクールアイドルクラブ\s*/g, '蓮ノ空 ')
    .replace(/^ラブライブ！スーパースター!!\s*Liella!\s*/g, 'Liella! ')
    .replace(/^ラブライブ！虹ヶ咲学園スクールアイドル同好会\s*/g, '虹ヶ咲 ')
    .replace(/^ラブライブ！サンシャイン!!\s*Aqours\s*/g, 'Aqours ')
    .replace(/^ラブライブ！サンシャイン!!\s*(?=第[0-9０-９]+回沼津)/g, 'Aqours ')
    .replace(/^ラブライブ！サンシャイン!!\s*/g, '')
    .replace(/^LoveLive!\s*Series\s*15th\s*Anniv(?:ersary|esary)\s*/gi, 'LoveLive! 15th ')
    .replace(/^プロジェクトセカイ\s*COLORFUL LIVE/g, 'プロセカ COLORFUL LIVE')
    .replace(/^プロセカユニットファンミーティング\s*/g, 'プロセカ ファンミ ')
    .replace(/^THE IDOLM@STER SHINY COLORS\s*/gi, 'シャニマス ')
    .replace(/^Animelo Summer Live\s*(\d{4})\s*-\s*([^-]+)-\s*/gi, 'アニサマ $1 -$2- ');

  // Remove trailing session / day / date markers
  s = s
    .replace(/\s*(?:＜Day\.?\s*\d+＞|＜[昼夜]公演＞|《[昼夜]公演》|＜[昼夜]の部＞|＜第\d+回公演＞)+/gi, '')
    .replace(/\s*(?:Day\.?\s*\d+|DAY\.?\s*\d+|\d+日目)(?:\s*(?:昼公演|夜公演|昼の部|夜の部))?$/gi, '')
    .replace(/\s+\d{1,2}\/\d{1,2}(?:\s*(?:昼公演|夜公演|昼の部|夜の部))?$/g, '')
    .replace(/\s+\d{1,2}月\d{1,2}日(?:\d{1,2}:\d{2})?(?:\([^)]+\))?(?:\s*(?:昼公演|夜公演|昼の部|夜の部))?$/g, '')
    .replace(/\s+(?:昼公演|夜公演|昼の部|夜の部)$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Short label strips long tour subtitles ～...～ when both a numbered live and a ＜...公演＞ or subtitle exist
  let short = s;
  const hasLeg = /＜[^＞]+＞/.test(short);
  if (hasLeg && /～[^～]+～/.test(short) && /\d+(?:st|nd|rd|th)\s*(?:LoveLive!|Live|LIVE)/i.test(short)) {
    short = short.replace(/\s*～[^～]+～\s*/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // Shorten ＜Bloom Garden Party Stage／埼玉公演＞ -> ＜埼玉公演＞ if combining multiple legs
  short = short
    .replace(/＜[^／＞]+／([^＞]+)＞/g, '＜$1＞')
    .replace(/＜([^＞]*?) presents ([^＞]+)＞/g, '＜$1＞')
    .trim();

  // Group key strips subtle spacing/case differences
  const groupKey = short.toLowerCase().replace(/[\s・!！?？～〜\-]+/g, '');

  return {
    fullLabel: s,
    shortLabel: short,
    groupKey
  };
}

function scoreEventImportance(ev: EventernoteEvent): number {
  let score = 40;
  const name = ev.name;
  const place = ev.place;

  // Penalize side talk stages, release events, film screenings, sign events
  if (/トークステージ|トークショー|リリースイベント|サイン会|前夜祭\s*FILM LIVE|壮行会|ぱじゃまぱーてぃー/i.test(name)) {
    score -= 45;
  }

  // Venue scale
  if (/東京ドーム|バンテリンドーム|ナゴヤドーム|ベルーナドーム|西武ドーム|京セラドーム/i.test(place)) {
    score += 130;
  } else if (
    /アリーナ|日本武道館|幕張メッセ|大阪城ホール|マリンメッセ|ポートメッセ|Aichi Sky Expo|国立代々木|東京体育館|東京ガーデンシアター|パシフィコ横浜|ワールド記念ホール|GLION|キラメッセ|石川県産業展示館|セキスイハイム|両国国技館|武蔵野の森|国営ひたち海浜公園/i.test(
      place
    )
  ) {
    score += 75;
  } else if (/Zepp|LINE CUBE|新国立劇場/i.test(place)) {
    score += 35;
  }

  // Marquee live types
  if (/Finale|卒業公演|ラブライブ！フェス|15th|10th Anniversary/i.test(name)) {
    score += 65;
  } else if (
    /\d+(?:st|nd|rd|th|∞th)\s*(?:LoveLive!|Live|LIVE|☆LIVE)|Link Live Dream|COLORFUL LIVE|Animelo Summer Live|LuckyFes|ANIMAX MUSIX|TWO-MAN LIVE|ちゅーとりえらいぶ|地元愛まつり|ARENA TOUR/i.test(
      name
    )
  ) {
    score += 45;
  }

  // Cast count bonus
  score += Math.min(ev.artists.length, 35) * 1.1;

  return score;
}

/**
 * Picks the headline live(s) for an eventing trip based on venue scale,
 * multi-day performance count, marquee live status, and cast size.
 */
export function deriveEventingTripTitle(events: EventernoteEvent[], fallbackCities: string[]): string {
  if (events.length === 0) {
    const citySummary = fallbackCities.length > 0 ? fallbackCities.join(' · ') : 'Transit';
    return `${citySummary} Trip`;
  }

  interface LiveGroup {
    groupKey: string;
    fullLabel: string;
    shortLabel: string;
    totalScore: number;
    maxSingleScore: number;
    count: number;
    firstDate: string;
  }

  const groups = new Map<string, LiveGroup>();

  for (const ev of events) {
    const { fullLabel, shortLabel, groupKey } = canonicalizeLiveName(ev.name);
    const singleScore = scoreEventImportance(ev);
    const existing = groups.get(groupKey);
    if (existing) {
      existing.count += 1;
      if (existing.count <= 3) {
        existing.totalScore += Math.max(25, singleScore * 0.55);
      }
      if (singleScore > existing.maxSingleScore) {
        existing.maxSingleScore = singleScore;
        existing.fullLabel = fullLabel;
        existing.shortLabel = shortLabel;
      }
    } else {
      groups.set(groupKey, {
        groupKey,
        fullLabel,
        shortLabel,
        totalScore: singleScore,
        maxSingleScore: singleScore,
        count: 1,
        firstDate: ev.date
      });
    }
  }

  const ranked = [...groups.values()].sort((a, b) => b.totalScore - a.totalScore);
  const top = ranked[0]!;
  const second = ranked[1];

  // If there is a second major distinct live on the same trip (e.g. a 2-week multi-weekend run),
  // include both if the second live is also a major live (>= 62% of top score and maxSingleScore >= 95)
  if (
    second &&
    second.maxSingleScore >= 80 &&
    second.totalScore >= top.totalScore * 0.58 &&
    !top.shortLabel.slice(0, 12).includes(second.shortLabel.slice(0, 12))
  ) {
    const ordered = [top, second].sort((a, b) => a.firstDate.localeCompare(b.firstDate));
    return `${ordered[0]!.shortLabel} & ${ordered[1]!.shortLabel}`;
  }

  return top.shortLabel;
}

/**
 * Clusters chronological Flighty records into distinct Trips anchored around SFO,
 * and matches Eventernote events falling within each trip's window.
 */
export function buildTrips(
  flights: PublicFlightRecord[],
  events: EventernoteEvent[],
  todayStr: string = new Date().toISOString().slice(0, 10),
  overrides: TripOverride[] = []
): Trip[] {
  const overrideMap = new Map(overrides.map((o) => [o.id, o]));

  const validFlights = flights
    .filter((f) => !f.is_cancelled && f.departureScheduleGateOriginal)
    .sort((a, b) =>
      (a.departureScheduleGateOriginal ?? '').localeCompare(b.departureScheduleGateOriginal ?? '')
    );

  const clusters: PublicFlightRecord[][] = [];
  let current: PublicFlightRecord[] = [];

  for (let i = 0; i < validFlights.length; i++) {
    const flight = validFlights[i]!;
    const prev = current[current.length - 1];

    if (current.length === 0) {
      current.push(flight);
    } else {
      const prevArrTs = new Date(
        prev!.arrivalScheduleGateOriginal ?? prev!.departureScheduleGateOriginal!
      ).getTime();
      const depTs = new Date(flight.departureScheduleGateOriginal!).getTime();
      const gapDays = (depTs - prevArrTs) / 86400000;

      const prevEndedHome = HOME_AIRPORTS.has(prev!.arrival_airport_iata);
      const startsFromHome = HOME_AIRPORTS.has(flight.departure_airport_iata);
      const prevEndedOpenJawWithGap =
        US_GATEWAY_AIRPORTS.has(prev!.arrival_airport_iata) &&
        prev!.departure_country !== 'United States' &&
        gapDays > 2;

      if (prevEndedHome || startsFromHome || prevEndedOpenJawWithGap || gapDays > 25) {
        clusters.push(current);
        current = [flight];
      } else {
        current.push(flight);
      }
    }

    if (HOME_AIRPORTS.has(flight.arrival_airport_iata)) {
      clusters.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    clusters.push(current);
  }

  // First pass: compute trip metadata before event assignment
  const rawTrips = clusters.map((clusterFlights) => {
    const first = clusterFlights[0]!;
    const last = clusterFlights[clusterFlights.length - 1]!;

    const startDate = toLocalDateString(
      first.departureScheduleGateOriginal,
      first.departure_timezone
    );
    const lastArrivalDate = toLocalDateString(
      last.arrivalScheduleGateOriginal ?? last.departureScheduleGateOriginal,
      last.arrival_timezone
    );
    const endDate = lastArrivalDate >= startDate ? lastArrivalDate : startDate;

    const isInternational = clusterFlights.some(
      (f) => f.departure_country !== 'United States' || f.arrival_country !== 'United States'
    );

    const destCities: string[] = [];
    const destCountries: string[] = [];
    const routeAirports: string[] = [first.departure_airport_iata];

    const addCityCountry = (city: string, country: string, iata: string) => {
      if (HOME_AIRPORTS.has(iata)) return;
      if (isInternational && (country === 'United States' || US_GATEWAY_AIRPORTS.has(iata))) return;
      if (city && !destCities.includes(city)) destCities.push(city);
      if (country && !destCountries.includes(country)) destCountries.push(country);
    };

    addCityCountry(first.departure_city, first.departure_country, first.departure_airport_iata);

    for (let i = 0; i < clusterFlights.length; i++) {
      const f = clusterFlights[i]!;
      const next = clusterFlights[i + 1];
      routeAirports.push(f.arrival_airport_iata);

      let isShortTransit = false;
      if (next && f.arrivalScheduleGateOriginal && next.departureScheduleGateOriginal) {
        const layoverHours =
          (new Date(next.departureScheduleGateOriginal).getTime() -
            new Date(f.arrivalScheduleGateOriginal).getTime()) /
          3600000;
        if (
          layoverHours >= 0 &&
          layoverHours < 7 &&
          f.arrival_city === next.departure_city &&
          clusterFlights.length > 2
        ) {
          isShortTransit = true;
        }
      }

      if (!isShortTransit) {
        addCityCountry(f.arrival_city, f.arrival_country, f.arrival_airport_iata);
      }
      if (i > 0) {
        addCityCountry(f.departure_city, f.departure_country, f.departure_airport_iata);
      }
    }

    if (destCities.length === 0) {
      for (const f of clusterFlights) {
        if (!HOME_AIRPORTS.has(f.arrival_airport_iata) && f.arrival_city) {
          if (!destCities.includes(f.arrival_city)) destCities.push(f.arrival_city);
          if (f.arrival_country && !destCountries.includes(f.arrival_country)) {
            destCountries.push(f.arrival_country);
          }
        }
      }
    }

    return {
      clusterFlights,
      startDate,
      endDate,
      isInternational,
      destCities,
      destCountries,
      routeAirports
    };
  });

  // Assign Eventernote events: international trips claim events in [startDate - 1d, endDate + 1d] first
  const claimedEventIds = new Set<string>();
  const eventsByTripIndex = new Map<number, EventernoteEvent[]>();

  // Pass 1: International trips
  rawTrips.forEach((rt, idx) => {
    if (!rt.isInternational) return;
    const windowStart = addDays(rt.startDate, -1);
    const windowEnd = addDays(rt.endDate, 1);
    const matched = events
      .filter((ev) => !claimedEventIds.has(ev.id) && ev.date >= windowStart && ev.date <= windowEnd)
      .sort((a, b) => a.date.localeCompare(b.date));
    for (const ev of matched) claimedEventIds.add(ev.id);
    eventsByTripIndex.set(idx, matched);
  });

  // Pass 2: Domestic trips (only match unclaimed events strictly within [startDate, endDate] that don't have Japanese venues)
  rawTrips.forEach((rt, idx) => {
    if (rt.isInternational) return;
    const matched = events
      .filter(
        (ev) =>
          !claimedEventIds.has(ev.id) &&
          ev.date >= rt.startDate &&
          ev.date <= rt.endDate &&
          !/[\u3040-\u30ff\u4e00-\u9faf]/.test(ev.place)
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    for (const ev of matched) claimedEventIds.add(ev.id);
    eventsByTripIndex.set(idx, matched);
  });

  const trips: Trip[] = rawTrips.map((rt, idx) => {
    const matchedEvents = eventsByTripIndex.get(idx) ?? [];
    const { clusterFlights, startDate, endDate, destCities, destCountries, routeAirports } = rt;

    for (const ev of matchedEvents) {
      if (
        ev.place.includes('横浜') ||
        ev.place.includes('ぴあアリーナ') ||
        ev.place.includes('Kアリーナ') ||
        ev.place.includes('パシフィコ')
      ) {
        if (!destCities.includes('Yokohama')) destCities.push('Yokohama');
      }
      if (ev.place.includes('名古屋') || ev.place.includes('愛知') || ev.place.includes('ポートメッセ')) {
        if (!destCities.includes('Nagoya')) destCities.push('Nagoya');
      }
      if (ev.place.includes('福岡')) {
        if (!destCities.includes('Fukuoka')) destCities.push('Fukuoka');
      }
      if (ev.place.includes('沼津')) {
        if (!destCities.includes('Numazu')) destCities.push('Numazu');
      }
      if (ev.place.includes('大阪') || ev.place.includes('神戸')) {
        if (!destCities.includes('Osaka')) destCities.push('Osaka');
      }
    }

    const id = `trip-${startDate}-${destCities[0]?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'travel'}`;
    const override = overrideMap.get(id);
    if (override?.extraCities) {
      for (const c of override.extraCities) {
        if (!destCities.includes(c)) destCities.push(c);
      }
    }

    const nonUsCountries = destCountries.filter((c) => c !== 'United States');
    const primaryCountry = nonUsCountries[0] ?? destCountries[0] ?? 'Travel';
    const citySummary = destCities.length > 0 ? destCities.join(' · ') : 'Transit';
    const primaryRegion =
      primaryCountry === 'United States'
        ? `${citySummary}, USA`
        : `${citySummary}, ${primaryCountry}`;

    const defaultTitle = deriveEventingTripTitle(matchedEvents, destCities);
    const resolvedTitle = override?.title ?? defaultTitle;
    const resolvedTitleEn = translateTripTitleToEn(resolvedTitle);
    const enrichedEvents = matchedEvents.map((ev) => ({
      ...ev,
      nameEn: ev.nameEn ?? translateEventNameToEn(ev.name),
      placeEn: ev.placeEn ?? translateVenueToEn(ev.place)
    }));
    const totalDistanceKm = clusterFlights.reduce((sum, f) => sum + (f.distance_km ?? 0), 0);

    const status: Trip['status'] =
      endDate < todayStr
        ? 'past'
        : startDate <= todayStr && todayStr <= endDate
          ? 'active'
          : 'upcoming';

    return {
      id,
      title: resolvedTitle,
      titleEn: resolvedTitleEn,
      primaryRegion,
      countries: destCountries,
      cities: destCities,
      airports: routeAirports,
      startDate,
      endDate,
      durationDays: daysBetween(startDate, endDate),
      totalDistanceKm,
      flights: clusterFlights,
      events: enrichedEvents,
      status,
      isEventingTrip: enrichedEvents.length > 0,
      notes: override?.notes
    };
  });

  return trips.sort((a, b) => b.startDate.localeCompare(a.startDate));
}
