# Roadmap

Where the app is going, in the order it should be built. The near-term
subject of this document is **v2: sharing a shopping list with a family
member, with an in-app push notification** — no email, no SMS.

Sizes are relative effort (S / M / L), not dates.

## Version overview

| Version | Theme                                    | Status      |
|---------|------------------------------------------|-------------|
| v1      | Shopping list, local-only                | in progress |
| v2      | Households + shared lists + push         | planned     |
| v3+     | Todos, reminders, cleaning, money        | not started |

Every feature after v2 inherits sharing for free — that is the whole
point of doing households once, in `src/shared/`, rather than per
feature.

## Two facts that shape everything below

1. **Push notifications end the Expo Go workflow.** Remote push was
   removed from Expo Go in SDK 53; `getExpoPushTokenAsync()` throws
   there. `CLAUDE.md` pins SDK 54 *because* that is the highest SDK this
   device's Expo Go supports. v2 therefore requires a development build,
   an Apple Developer account (APNs key, ~$99/yr) and an FCM v1 service
   account. This is the single biggest cost in v2 and the reason
   Phase 1 exists.
2. **There is no "list" in the schema.** `shopping_items` is one flat
   table; a list is currently just "the rows that aren't deleted or
   archived". Sharing needs a list to be a real, addressable row. That
   is Phase 3, and it is worth doing even if sharing is later dropped.

## Dependency graph

```
        ┌──────────────────────────────┐
        │ Phase 0 — finish v1 (gate)   │
        └───────────────┬──────────────┘
                        │
          ┌─────────────┴──────────────┐
          ▼                            ▼
┌───────────────────────┐   ┌────────────────────────┐
│ Phase 1 — dev build   │   │ Phase 3 — lists as an  │
│ + push proof of       │   │ entity (LOCAL ONLY,    │
│ concept               │   │ no backend)            │
└───────────┬───────────┘   └───────────┬────────────┘
            │                           │
            ▼                           │
┌───────────────────────┐               │
│ Phase 2 — accounts +  │               │
│ households            │               │
└───────────┬───────────┘               │
            └───────────┬───────────────┘
                        ▼
        ┌──────────────────────────────┐
        │ Phase 4 — sync               │
        └───────────────┬──────────────┘
                        ▼
        ┌──────────────────────────────┐
        │ Phase 5 — notifications      │
        └───────────────┬──────────────┘
                        ▼
        ┌──────────────────────────────┐
        │ Phase 6 — hardening          │
        └──────────────────────────────┘
```

Phases 1 and 3 are independent. Phase 3 is pure local work and can start
while build credentials are being sorted out.

---

## Phase 0 — Finish v1 · size S · **gate**

Nothing in v2 starts until the shopping list is done. `CLAUDE.md` says
build the shopping list only, and `docs/architecture.md` forbids
Supabase packages in v1 "even to prepare". Opening v2 early means
carrying two half-finished things.

**Done means:** every box in the "Done means" list of
`docs/features/shopping-list.md` is checked, `yarn typecheck` and
`yarn test` pass clean.

**Explicit decision to record here when it happens:** v1 is closed, v2
is open. Update `CLAUDE.md`'s "Current focus" in the same commit.

---

## Phase 1 — Development build + push proof of concept · size M

The riskiest and least reversible part, so it goes first. It is pure
infrastructure — no product code.

**Deliverables**
- Expo account + EAS project; `extra.eas.projectId` added to `app.json`
- `eas.json` with a `development` profile
- Apple Developer account enrolled; APNs key uploaded via `eas credentials`
- Firebase project; FCM v1 service account JSON uploaded
- `expo-notifications` + `expo-device` installed, plugin registered
- A throwaway screen that requests permission, prints the Expo push
  token, and receives a push sent by hand from Expo's push tool
- Android notification channel declared (required, or Android 8+ drops
  the notification silently)

**Done means:** a push sent from a laptop appears on the physical phone,
in both foreground and background, on iOS and Android.

**Risks**
- Apple enrollment can take days. Start it on day one of this phase.
- Simulators cannot receive push. A physical device is required.
- Once on a dev build, every native dependency change needs a rebuild.
  Iteration gets slower; this is permanent.

---

## Phase 2 — Accounts and households · size M

Depends on Phase 1 only for the build; the code is independent.

**The identity design.** Invites must reach a person who may not have
the app yet — but the requirement is no email and no SMS. Resolved with
a **one-time join, then in-app forever**:

```
A creates a household        →  gets a short join code (or QR)
code travels out-of-band     →  spoken, AirDrop, however A likes
B installs the app, enters it →  B is now a known account
everything after that        →  pure in-app push. No email, ever.
```

The alternative — invite by email address of an existing account —
requires a lookup by email and leaks addresses between users. The join
code is simpler and matches the requirement.

**Deliverables**
- Supabase project (free tier is sufficient)
- `@supabase/supabase-js` + `@react-native-async-storage/async-storage`
- Supabase Auth, anonymous sign-in — no password screens in v2
- Tables: `households`, `household_members`, `household_join_codes`
- **RLS policies on every table.** "You may read/write rows whose
  `household_id` is one you are a member of." This is the actual
  security boundary and must be right before anything ships.
- `src/shared/auth/` — session, current user id
- `src/shared/household/` — create / join / leave, member list, invite UI

**Done means:** two physical phones end up in the same household,
verified in the Supabase dashboard; a third phone with a wrong code is
rejected; RLS blocks cross-household reads when tested directly against
the API.

**Open decisions**
- Join code lifetime and single-use vs. reusable (recommend: single-use,
  24h expiry)
- Whether anonymous accounts can be upgraded later without data loss

---

## Phase 3 — Lists as a real entity · size M · **local only**

No backend. No network. Ships as a normal local release and is valuable
on its own — it is the precondition for "archived lists" in
`docs/features/shopping-list.md` too.

**Deliverables**
- **Migration v4**, appended to `src/shared/db/migrations.ts` — never
  edit v1–v3, they have already run on the device:
  - `CREATE TABLE shopping_lists` (id, name, timestamps, `archived_at`)
  - `ALTER TABLE shopping_items ADD COLUMN list_id`
  - backfill every existing row into one default list
- `src/features/shopping-list/db.ts` — every query gains a `list_id`
  filter; `archiveAll` archives the list row rather than each item
- `store.ts` — carries a current list id
- Tests extended: the existing suites in
  `src/features/shopping-list/__tests__/` must cover the backfill and
  the list-scoped queries

**Done means:** existing items survive the migration and appear in the
default list; `yarn test` passes; behaviour is visibly unchanged to the
user.

**Risk:** the backfill runs on real device data. Test it against a
database seeded with pre-v4 rows, not just a fresh one.

---

## Phase 4 — Sync · size L

The hardest phase. `updated_at` / `deleted_at` / UUID ids exist
precisely for this.

**Deliverables**
- Supabase mirrors of `shopping_lists` and `shopping_items`, with
  `household_id` and RLS
- `src/shared/sync/` — push local changes up, pull remote changes down,
  reconcile
- Realtime subscription so a second phone updates without a refresh
- `store.ts` must accept rows it did not write. Today it is the sole
  writer; that assumption disappears here and is the most likely source
  of bugs.
- Offline queue — the app must stay fully usable with no network, which
  is what the local-first design was for

**Conflict rule:** last-write-wins on `updated_at`. Correct enough for a
shopping list, and the schema already supports it. Do not build CRDTs.

**Done means:** an item added on phone A appears on phone B within a
second or two; both phones can go offline, diverge, and reconcile on
reconnect without losing or duplicating rows.

---

## Phase 5 — Notifications · size M

Only now, with households and sync working, is there something to
notify about.

**Deliverables**
- `device_push_tokens` table (user_id, expo_token, platform,
  updated_at) — one user has many devices
- `notification_outbox` table — queued sends, delivery receipts, dedup
- Edge Function `send-push` — takes `{ userIds, title, body, data }`,
  looks up tokens, POSTs to `https://exp.host/--/api/v2/push/send` in
  chunks of 100, **then polls the receipts endpoint and deletes tokens
  that return `DeviceNotRegistered`**. Skipping receipt handling is the
  standard mistake; dead tokens otherwise accumulate forever.
- Postgres triggers via `pg_net` on `household_members` insert and
  `shopping_items` insert. Server-side, not client-side, so the
  notification still fires when the sender's app is backgrounded
  mid-write.
- `src/shared/notifications/` — permission request, token registration
  and refresh, foreground handler, and the tap handler that deep-links
  through `expo-router` using `data.listId`

**The notifications themselves**

| Event                        | Message                          | Notes                    |
|------------------------------|----------------------------------|--------------------------|
| Added to a household         | "Lou shared Groceries with you"  | immediate                |
| Someone adds items           | "Lou added 4 items"              | **batched**, ~30s debounce |
| Someone archives the list    | "Shopping done"                  | immediate                |

Batching is not optional. One push per item makes a twenty-item shop
unbearable, and it is the difference between a feature people keep
enabled and one they turn off.

Never notify the actor about their own action.

**Done means:** phone B gets a notification for phone A's action;
tapping it opens the right list; a rapid burst of adds produces one
batched notification; uninstalling on B stops sends and prunes the token.

---

## Phase 6 — Hardening · size S–M

- Leaving a household, and what happens to lists you shared
- Notification preferences (per-household mute, at minimum)
- Token refresh on app update / OS restore
- Rate limiting on join-code attempts
- Backfilling push tokens for users who denied permission and later
  changed their mind in OS settings

---

## Running cost

| Item                        | Cost                                |
|-----------------------------|-------------------------------------|
| Apple Developer Program     | ~$99/yr — **required** for iOS push |
| Google Play (if publishing) | $25 one-time                        |
| Supabase                    | free tier is sufficient at this size|
| Expo push service           | free                                |
| EAS builds                  | free tier is enough at this cadence |

---

## Out of scope for v2

- Multiple households per user (one is enough; the schema allows more later)
- Roles or permissions beyond owner/member
- Web push
- Presence ("Lou is shopping right now")
- Sharing anything other than shopping lists — todos and money inherit
  the shared household layer when those features are built, not before
- Email or SMS delivery of anything, including invites

---

## Open decisions to make before Phase 2

1. Anonymous auth, or a real sign-in from the start? (Recommend
   anonymous — no password UI, and it can be upgraded later.)
2. Join code or QR, or both? (Recommend code first; QR is a small
   addition afterwards.)
3. One shared list per household, or many? (Recommend one for v2. Many
   lists is a UI problem, not a data problem, and can wait.)
