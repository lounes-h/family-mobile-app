import { useEffect, useRef } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/shared/components/EmptyState';
import { colors, spacing, typography } from '@/shared/theme';
import { useShoppingList } from '../store';
import type { ShoppingItem } from '../types';
import { AddItemBar, type AddItemBarHandle } from './AddItemBar';
import { ShoppingItemRow } from './ShoppingItemRow';

// Feature root. app/index.tsx renders only this. Owns no data logic itself —
// it reads from the store and wires the pieces together. Keyboard placement is
// handled inside AddItemBar, so there's no KeyboardAvoidingView here.
export function ShoppingList() {
  const {
    items,
    loaded,
    lastAddedId,
    load,
    addItem,
    renameItem,
    toggleBought,
    deleteItem,
    archive,
    clear,
  } = useShoppingList();
  const addBarRef = useRef<AddItemBarHandle>(null);
  const listRef = useRef<FlatList<ShoppingItem>>(null);
  const scrolledForRef = useRef<string | null>(null);

  // Load persisted items once on mount (this is why they survive a restart).
  useEffect(() => {
    load();
  }, [load]);

  // A freshly added item lands at the end of the unbought group, which can sit
  // behind the keyboard/add bar. Scroll it into view (once per add).
  useEffect(() => {
    if (!lastAddedId || lastAddedId === scrolledForRef.current) return;
    const index = items.findIndex((i) => i.id === lastAddedId);
    if (index < 0) return;
    scrolledForRef.current = lastAddedId;
    // viewPosition: 1 aligns the item to the bottom of the visible list, just
    // above the add bar. Deferred so the new row is laid out first.
    requestAnimationFrame(() =>
      listRef.current?.scrollToIndex({ index, viewPosition: 1, animated: true }),
    );
  }, [lastAddedId, items]);

  const openAdd = () => addBarRef.current?.open();

  // Toggling bought, plus the "everything is checked off" flow: when the last
  // unbought item is marked bought, offer to archive the finished list.
  const handleToggleBought = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const markingBought = item.bought_at === null;
    const unboughtCount = items.filter((i) => i.bought_at === null).length;
    const wasLastUnbought = markingBought && unboughtCount === 1;

    toggleBought(id);

    if (wasLastUnbought) {
      Alert.alert(
        'Done shopping?',
        "This shopping list will be archived as you're done shopping.",
        [
          // Revert the item we just checked so shopping can continue.
          { text: 'Still shopping', style: 'cancel', onPress: () => toggleBought(id) },
          { text: 'Yes', onPress: archive },
        ],
      );
    }
  };

  const confirmClear = () => {
    Alert.alert('Delete list and all its items', undefined, [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: clear },
    ]);
  };

  const isEmpty = items.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
        {!isEmpty && (
          <Pressable
            accessibilityRole="button"
            onPress={confirmClear}
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.body}>
        {isEmpty ? (
          // Show nothing until the first load resolves, to avoid flashing the
          // empty message before persisted items arrive.
          loaded ? (
            <EmptyState text="tap to add item" onPress={openAdd} />
          ) : (
            <View style={styles.body} />
          )
        ) : (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            // If the target row isn't measured yet, fall back to the end.
            onScrollToIndexFailed={() =>
              requestAnimationFrame(() =>
                listRef.current?.scrollToEnd({ animated: true }),
              )
            }
            renderItem={({ item }) => (
              <ShoppingItemRow
                item={item}
                onRename={renameItem}
                onToggleBought={handleToggleBought}
                onDelete={deleteItem}
              />
            )}
          />
        )}
      </View>

      <AddItemBar ref={addBarRef} onAdd={addItem} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: typography.title, fontWeight: '700', color: colors.text },
  clear: { fontSize: typography.body, color: colors.danger, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
