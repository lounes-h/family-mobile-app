import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Input } from '@/shared/components/Input';
import { colors, spacing, typography } from '@/shared/theme';
import type { ShoppingItem } from '../types';

type Props = {
  item: ShoppingItem;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

// One row: a bullet, the item name, and a trailing control.
//   - Not editing: tapping the name starts an edit; the ✕ deletes the item.
//   - Editing: an in-place text field; the ✓ confirms the change. Tapping away
//     (blur) discards the edit and keeps the old name.
export function ShoppingItemRow({ item, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);

  // Set right before the ✓ button blurs the input, so the blur handler knows
  // to confirm rather than discard.
  const confirmingRef = useRef(false);
  // Guards against a tap firing both onPress and onBlur — only the first of
  // confirm/discard per edit takes effect.
  const settledRef = useRef(false);

  const beginEdit = () => {
    setDraft(item.name);
    settledRef.current = false;
    setEditing(true);
  };

  const confirm = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    const trimmed = draft.trim();
    // Empty name is not allowed — keep the old one (see shopping-list.md).
    if (trimmed && trimmed !== item.name) {
      onRename(item.id, trimmed);
    }
    setEditing(false);
  };

  const discard = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    setDraft(item.name);
    setEditing(false);
  };

  const handleBlur = () => {
    if (confirmingRef.current) {
      confirmingRef.current = false;
      confirm();
      return;
    }
    discard(); // tapped away: throw away the edit
  };

  return (
    <View style={styles.row}>
      {editing ? (
        <>
          <View style={styles.bullet} />
          <Input
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={confirm}
            onBlur={handleBlur}
            autoFocus
            blurOnSubmit={false}
            returnKeyType="done"
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Save ${item.name}`}
            hitSlop={8}
            onPressIn={() => {
              confirmingRef.current = true;
            }}
            onPress={confirm}
            style={styles.action}
          >
            <Text style={styles.check}>✓</Text>
          </Pressable>
        </>
      ) : (
        <>
          {/* Bullet + name are one tap target, so tapping the circle edits too. */}
          <Pressable style={styles.tapArea} onPress={beginEdit}>
            <View style={styles.bullet} />
            <Text style={styles.name}>{item.name}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.name}`}
            hitSlop={8}
            onPress={() => onDelete(item.id)}
            style={styles.action}
          >
            <Text style={styles.delete}>✕</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
  },
  tapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  name: { fontSize: typography.body, color: colors.text },
  input: { flex: 1, minHeight: 40 },
  action: { padding: spacing.xs },
  delete: { fontSize: typography.body, color: colors.textMuted },
  check: { fontSize: typography.body, color: colors.primary, fontWeight: '700' },
});
