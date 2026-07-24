import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '@/shared/components/Input';
import { useKeyboardHeight } from '@/shared/hooks/useKeyboardHeight';
import { colors, radius, spacing, typography } from '@/shared/theme';

export type AddItemBarHandle = { open: () => void };

type Props = {
  onAdd: (name: string) => void;
};

// Fixed bar at the bottom of the screen. By default it's just a "+ Add item"
// button. Tapping it reveals a focused text field that sits right on top of
// the keyboard; confirming adds the item and keeps the field open (and
// focused) so several items can be added in a row. Dismissing the keyboard
// (tapping away) collapses it back to the button.
// Exposes open() via ref so the empty-state text can trigger it too.
export const AddItemBar = forwardRef<AddItemBarHandle, Props>(function AddItemBar(
  { onAdd },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  // Set right before an action that momentarily blurs the input (tapping the
  // Add button), so the blur handler knows not to collapse the bar.
  const keepOpenRef = useRef(false);

  const focus = () => requestAnimationFrame(() => inputRef.current?.focus());

  const openBar = () => {
    setOpen(true);
    focus();
  };

  useImperativeHandle(ref, () => ({ open: openBar }));

  const submit = () => {
    const trimmed = text.trim();
    if (trimmed) onAdd(trimmed); // empty / whitespace-only is ignored
    setText('');
    focus(); // stay open + focused for the next item
  };

  const handleBlur = () => {
    if (keepOpenRef.current) {
      keepOpenRef.current = false;
      return; // a submit/confirm is in flight — keep the bar open
    }
    // Keyboard dismissed by tapping away: collapse back to just the button.
    setText('');
    setOpen(false);
  };

  // Lift above the keyboard when open; otherwise rest above the home indicator.
  // With Android edge-to-edge the reported keyboard height excludes the
  // navigation-bar inset, but the keyboard draws from the true screen bottom —
  // so add insets.bottom to clear the last sliver.
  const paddingBottom =
    keyboardHeight > 0
      ? keyboardHeight + insets.bottom + spacing.sm
      : insets.bottom;

  return (
    <View style={[styles.bar, { paddingBottom }]}>
      {open ? (
        <View style={styles.editRow}>
          <Input
            ref={inputRef}
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            onBlur={handleBlur}
            placeholder="Item name"
            autoFocus
            blurOnSubmit={false}
            returnKeyType="done"
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add"
            onPressIn={() => {
              keepOpenRef.current = true;
            }}
            onPress={submit}
            style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}
          >
            <Text style={styles.confirmText}>Add</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={openBar}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addButtonText}>＋ Add item</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
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
