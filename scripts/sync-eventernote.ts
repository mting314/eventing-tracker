/**
 * Direct Eventernote fetcher & HTML parser (ported from llernote/scripts/eventernote-server.ts).
 * Calls getUserEvents('tinmsnake') directly as a function — no intermediate HTTP server needed.
 */
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export interface EventernoteEvent {
  id: string;
  name: string;
  href: string;
  url: string;
  date: string;
  rawDate: string;
  dayOfWeek: string;
  place: string;
  artists: string[];
}

const here = dirname(fileURLToPath(import.meta.url));
const cacheRoot = join(here, '../data/.cache/eventernote-html');
const outputPath = join(here, '../data/events.json');

const ORIGIN = 'https://www.eventernote.com';
const DEFAULT_USER = process.env.EVENTERNOTE_USER ?? 'tinmsnake';
const USER_AGENT =
  process.env.EVENTERNOTE_USER_AGENT ??
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const PAGE_SIZE = 100;
const REQUEST_DELAY_MS = Number(process.env.EVENTERNOTE_DELAY_MS ?? 1200);
const CACHE_TTL_MS = Number(process.env.EVENTERNOTE_CACHE_TTL_MS ?? 6 * 60 * 60 * 1000);

const decodeEntities = (text: string) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&');

const stripTags = (html: string) => decodeEntities(html.replace(/<[^>]*>/g, '')).trim();

export const listItems = (html: string): string[] => {
  const start = html.indexOf('gb_event_list');
  if (start === -1) return [];
  const scope = html.slice(start);
  const items: string[] = [];
  const opener = /<li class="clearfix[^"]*"[^>]*>/g;
  let match: RegExpExecArray | null;

  while ((match = opener.exec(scope)) !== null) {
    let depth = 1;
    const tag = /<\/?li\b[^>]*>/g;
    tag.lastIndex = match.index + match[0].length;
    let cursor: RegExpExecArray | null;
    while (depth > 0 && (cursor = tag.exec(scope)) !== null) {
      depth += cursor[0].startsWith('</') ? -1 : 1;
    }
    if (depth !== 0) continue;
    items.push(scope.slice(match.index, tag.lastIndex));
    opener.lastIndex = tag.lastIndex;
  }
  return items;
};

export const parseEvent = (item: string): EventernoteEvent | undefined => {
  const link = /<h4>\s*<a href="(\/events\/(\d+))"[^>]*>([\s\S]*?)<\/a>/.exec(item);
  if (!link) return undefined;

  const dateBlock = /<div class="date">([\s\S]*?)<\/div>/.exec(item)?.[1] ?? '';
  const placeBlock = /<div class="place">([\s\S]*?)<\/div>/.exec(item)?.[1] ?? '';
  const actorBlock = /<div class="actor">([\s\S]*?)<\/div>/.exec(item)?.[1] ?? '';

  const rawDate = stripTags(/<p class="day\d"[^>]*>([\s\S]*?)<\/p>/.exec(dateBlock)?.[1] ?? '');
  const isoDate = /\d{4}-\d{2}-\d{2}/.exec(rawDate)?.[0] ?? rawDate;
  const dowMatch = /\(([^)]+)\)/.exec(rawDate);

  const href = link[1]!;
  const id = link[2]!;

  return {
    id,
    name: stripTags(link[3]!),
    href,
    url: `${ORIGIN}${href}`,
    date: isoDate,
    rawDate,
    dayOfWeek: dowMatch?.[1] ?? '',
    place: stripTags(placeBlock).replace(/^会場:\s*/, ''),
    artists: [...actorBlock.matchAll(/<a href="\/actors\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g)]
      .map((m) => stripTags(m[1]!))
      .filter(Boolean)
  };
};

export const parseEventList = (html: string): EventernoteEvent[] =>
  listItems(html)
    .map(parseEvent)
    .filter((event): event is EventernoteEvent => event !== undefined);

export const parseTotalCount = (html: string): number | undefined => {
  const match = /\((\d+)件\)/.exec(html);
  return match ? Number(match[1]) : undefined;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const cacheFile = (url: string) =>
  join(cacheRoot, `${createHash('sha1').update(url).digest('hex')}.html`);

const fetchPage = async (url: string): Promise<string> => {
  const file = cacheFile(url);
  if (existsSync(file) && existsSync(`${file}.at`)) {
    const age = Date.now() - Number(readFileSync(`${file}.at`, 'utf8'));
    if (age < CACHE_TTL_MS) return readFileSync(file, 'utf8');
  }

  console.log(`  → GET ${url}`);
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ja,en;q=0.8' }
  });
  if (!response.ok) {
    throw new Error(`Eventernote HTTP ${response.status} for ${url}`);
  }
  const html = await response.text();
  mkdirSync(cacheRoot, { recursive: true });
  writeFileSync(file, html);
  writeFileSync(`${file}.at`, String(Date.now()));
  await sleep(REQUEST_DELAY_MS);
  return html;
};

export const getUserEvents = async (
  userId: string = DEFAULT_USER,
  limit = 2000
): Promise<EventernoteEvent[]> => {
  const baseUrl = `${ORIGIN}/users/${encodeURIComponent(userId)}/events`;
  const events: EventernoteEvent[] = [];

  for (let page = 1; events.length < limit; page++) {
    const html = await fetchPage(`${baseUrl}?limit=${PAGE_SIZE}&page=${page}`);
    const pageEvents = parseEventList(html);
    events.push(...pageEvents);

    const total = parseTotalCount(html);
    if (pageEvents.length < PAGE_SIZE) break;
    if (total !== undefined && events.length >= total) break;
  }

  // Deduplicate by event ID and sort descending by date
  const byId = new Map<string, EventernoteEvent>();
  for (const ev of events.slice(0, limit)) {
    byId.set(ev.id, ev);
  }
  return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
};

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const userId = process.argv[2] ?? DEFAULT_USER;
  console.log(`Syncing Eventernote events for user "${userId}"...`);
  const events = await getUserEvents(userId);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(events, null, 2));
  console.log(`✅ Wrote ${events.length} Eventernote events to ${outputPath}`);
}
