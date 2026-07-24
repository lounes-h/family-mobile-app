import { ShoppingList } from '@/features/shopping-list';

// Thin screen: renders the shopping list feature and nothing else.
// Later this becomes one tab among several.
export default function HomeScreen() {
  return <ShoppingList />;
}
