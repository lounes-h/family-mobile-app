import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Input } from '@/shared/components/Input';
import { colors, spacing, typography } from '@/shared/theme';
import type { ShoppingItem } from '../types';

type Props = {
  item: ShoppingItem;
  onRename: (id: string, name: string) => void;
  onToggleBought: (id: string) => void;
  onDelete: (id: string) => void;
};

// One row: a check circle, the item name, and a trailing control.
//   - Not editing: tapping the circle marks the item bought (or un-bought);
//     tapping the name starts an edit; the ✕ deletes the item.
//   - Editing: an in-place text field; the ✓ confirms the change. Tapping away
//     (blur) discards the edit and keeps the old name.
export function ShoppingItemRow({
  item,
  onRename,
  onToggleBought,
  onDelete,
}: Props) {
  const bought = item.bought_at !== null;
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
          {/* Tapping the circle marks the item bought / un-bought. */}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: bought }}
            accessibilityLabel={`Mark ${item.name} ${bought ? 'not bought' : 'bought'}`}
            hitSlop={8}
            onPress={() => onToggleBought(item.id)}
            style={styles.checkTap}
          >
            <View style={[styles.bullet, bought && styles.bulletBought]}>
              {bought && <Text style={styles.bulletCheck}>✓</Text>}
            </View>
          </Pressable>
          {/* Bought items can't be edited — show the name as plain text. */}
          {bought ? (
            <View style={styles.tapArea}>
              <Text style={[styles.name, styles.nameBought]}>{item.name}</Text>
            </View>
          ) : (
            <Pressable style={styles.tapArea} onPress={beginEdit}>
              <Text style={styles.name}>{item.name}</Text>
            </Pressable>
          )}
          {/* Delete is disabled for bought items (only un-marking is allowed). */}
          {!bought && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
              hitSlop={8}
              onPress={() => onDelete(item.id)}
              style={styles.action}
            >
              <Text style={styles.delete}>✕</Text>
            </Pressable>
          )}
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
  checkTap: {
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  bullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletBought: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bulletCheck: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  tapArea: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  name: { fontSize: typography.body, color: colors.text },
  nameBought: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  input: { flex: 1, minHeight: 40 },
  action: { padding: spacing.xs },
  delete: { fontSize: typography.body, color: colors.textMuted },
  check: { fontSize: typography.body, color: colors.primary, fontWeight: '700' },
});
