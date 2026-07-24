// The ONLY file other code may import from. Screens render <ShoppingList />;
// nothing outside this feature reaches into its components, store, or db.
export { ShoppingList } from './components/ShoppingList';
export type { ShoppingItem } from './types';
