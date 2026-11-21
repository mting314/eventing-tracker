# eventing-tracker (`tinmsnake`)

Public GitHub Pages travel & eventing calendar combining **Flighty** flight telemetry with **[Eventernote (`tinmsnake`)](https://www.eventernote.com/users/tinmsnake/events)** concert & event attendance.

Built with **LLerNote's "live venue at night" aesthetic** (React 19 + Vite + Panda CSS + Park UI + `Zen Maru Gothic` / `Outfit`).

## Single Source of Truth Data Files (For Agents / Muse)

All synced data lives in `data/` and `public/`:

| File | Description |
| :--- | :--- |
| [`data/trips.json`](./data/trips.json) | **Clustered Trips** anchored around `SFO` (with open-jaw `LAX`/`SEA` gateway support), pairing every flight leg with all Eventernote events during that trip window. |
| [`data/flights.json`](./data/flights.json) | **Sanitized Flighty Flights** (189 legs): full airline, flight number, airport IATA/city/terminal/gate, timestamps, aircraft model, seat/cabin, distance, and delay reliability stats (PNR `booking_reference` stripped). |
| [`data/events.json`](./data/events.json) | **Eventernote Events** (160 events for `tinmsnake`): event ID, title, ISO date, day of week, venue (`会場`), performers (`出演者`), and canonical URL. |
| [`public/calendar.ics`](./public/calendar.ics) | **Subscribable RFC 5545 iCal Feed** containing multi-day trip banners, timed flight legs, and Eventernote events. |

## Commands

```bash
bun install              # install deps & run panda codegen
bun run sync             # sync Flighty SQLite DB + Eventernote (tinmsnake) + rebuild trips & calendar.ics
bun run sync:flighty     # sync flights only from ~/Library/Containers/com.flightyapp.flighty/.../MainFlightyDatabase.db
bun run sync:eventernote # sync Eventernote events for tinmsnake
bun run build:trips      # re-cluster data/flights.json + data/events.json -> data/trips.json & public/calendar.ics
bun dev                  # start local dev server
bun run build            # tsc + vite production build -> dist/
bun test                 # run vitest unit tests
```
