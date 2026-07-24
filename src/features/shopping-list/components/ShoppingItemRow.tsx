import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Input } from '@/shared/components/Input';
import { colors, spacing, typography } from '@/shared/theme';
import type { ShoppingItem } from '../types';

type Props = {
  item: ShoppingItem;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

// One row: a bullet, the item name, and a delete control. Tapping the name
// turns it into an in-place text field. Confirming an empty name cancels the
// edit and keeps the old name.
export function ShoppingItemRow({ item, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.name) {
      onRename(item.id, trimmed);
    }
    setDraft(trimmed || item.name); // revert visible draft if it was emptied
    setEditing(false);
  };

  const beginEdit = () => {
    setDraft(item.name);
    setEditing(true);
  };

  return (
    <View style={styles.row}>
      <View style={styles.bullet} />

      {editing ? (
        <Input
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={commit}
          onBlur={commit}
          autoFocus
          returnKeyType="done"
          style={styles.input}
        />
      ) : (
        <Pressable style={styles.namePress} onPress={beginEdit}>
          <Text style={styles.name}>{item.name}</Text>
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${item.name}`}
        hitSlop={8}
        onPress={() => onDelete(item.id)}
        style={styles.delete}
      >
        <Text style={styles.deleteText}>✕</Text>
      </Pressable>
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
  namePress: { flex: 1, paddingVertical: spacing.xs },
  name: { fontSize: typography.body, color: colors.text },
  input: { flex: 1, minHeight: 40 },
  delete: { padding: spacing.xs },
  deleteText: { fontSize: typography.body, color: colors.textMuted },
});
