import { randomUUID } from 'expo-crypto';

// UUIDs (never auto-increment ints) so two devices can create rows offline
// without colliding — see the sync-ready rules in docs/architecture.md.
export function id(): string {
  return randomUUID();
}
