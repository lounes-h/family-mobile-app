# Household App

A personal app for managing home life. Built feature-by-feature:
shopping list first, then todos, reminders, home cleaning, money management.

## Tech stack

- Expo SDK 54 (managed) + React Native 0.81, React 19
  (pinned to 54 — the highest SDK this device's Expo Go supports)
- Expo Router (file-based routing, typed routes on)
- TypeScript strict, `@/*` → `src/*`
- Zustand for state (one store per feature)
- expo-sqlite for local storage (v1 is local-only — no backend)

## Commands

- `yarn start` — Expo dev server (`yarn ios` / `yarn android` / `yarn web`)
- `yarn typecheck` — `tsc --noEmit`
- `yarn expo-doctor` — project health check
- `yarn expo install <pkg>` — add SDK packages at SDK-compatible versions

## Architecture rule (important)
Every feature lives in its own folder under `src/features/`.
Features never import from each other — only from `src/shared/`.
Read @docs/architecture.md before adding or changing structure.

## Current focus
Building the shopping list only. See @docs/features/shopping-list.md
Do NOT build other features yet, even if the architecture supports them.

## More docs


## Package manager
- Always use yarn. Never use npm or npx.

