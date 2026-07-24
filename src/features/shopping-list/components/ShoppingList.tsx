import { useEffect, useRef } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/shared/components/EmptyState';
import { colors, spacing, typography } from '@/shared/theme';
import { useShoppingList } from '../store';
import { AddItemBar, type AddItemBarHandle } from './AddItemBar';
import { ShoppingItemRow } from './ShoppingItemRow';

// Feature root. app/index.tsx renders only this. Owns no data logic itself —
// it reads from the store and wires the pieces together. Keyboard placement is
// handled inside AddItemBar, so there's no KeyboardAvoidingView here.
export function ShoppingList() {
  const {
    items,
    loaded,
    load,
    addItem,
    renameItem,
    toggleBought,
    deleteItem,
    clear,
  } = useShoppingList();
  const addBarRef = useRef<AddItemBarHandle>(null);

  // Load persisted items once on mount (this is why they survive a restart).
  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => addBarRef.current?.open();

  const confirmClear = () => {
    Alert.alert('Have you done shopping?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
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
            data={items}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <ShoppingItemRow
                item={item}
                onRename={renameItem}
                onToggleBought={toggleBought}
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
