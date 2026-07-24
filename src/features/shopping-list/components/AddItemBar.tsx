import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Input } from '@/shared/components/Input';
import { colors, radius, spacing, typography } from '@/shared/theme';

export type AddItemBarHandle = { open: () => void };

type Props = {
  onAdd: (name: string) => void;
};

// Fixed bar at the bottom of the screen. Collapsed it's a "+ Add item" button;
// tapping it reveals a focused text field. Confirming adds the item and keeps
// the field open (and focused) so several items can be added in a row.
// Exposes open() via ref so the empty-state text can trigger it too.
export const AddItemBar = forwardRef<AddItemBarHandle, Props>(function AddItemBar(
  { onAdd },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      // If already open, just refocus; requestAnimationFrame lets a freshly
      // mounted input exist before we focus it.
      requestAnimationFrame(() => inputRef.current?.focus());
    },
  }));

  const submit = () => {
    const trimmed = text.trim();
    if (trimmed) onAdd(trimmed); // empty / whitespace-only is ignored
    setText('');
    // Keep the field open and focused for the next item.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  if (!open) {
    return (
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addButtonText}>＋ Add item</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      <View style={styles.editRow}>
        <Input
          ref={inputRef}
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          placeholder="Item name"
          autoFocus
          blurOnSubmit={false}
          returnKeyType="done"
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add"
          onPress={submit}
          style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}
        >
          <Text style={styles.confirmText}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  addButton: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: '600',
  },
  editRow: { flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1, minHeight: 52 },
  confirm: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: '600',
  },
  pressed: { opacity: 0.8 },
});
