import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../theme';

type Props = {
  text: string;
  onPress?: () => void;
};

// Centered placeholder shown when a list has nothing in it. Optionally
// tappable — the shopping list uses that so tapping the empty message opens
// the add-item input.
export function EmptyState({ text, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={styles.container}
    >
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  text: {
    fontSize: typography.body,
    color: colors.textMuted,
  },
});
