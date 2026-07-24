import { useShoppingList } from '../store';
import * as db from '../db';
import type { ShoppingItem } from '../types';

jest.mock('../db');
const mockedDb = db as jest.Mocked<typeof db>;

const makeItem = (over: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: '1',
  name: 'Milk',
  created_at: '2020-01-01T00:00:00.000Z',
  updated_at: '2020-01-01T00:00:00.000Z',
  deleted_at: null,
  bought_at: null,
  archived_at: null,
  ...over,
});

const store = () => useShoppingList.getState();

beforeEach(() => {
  jest.clearAllMocks();
  mockedDb.listItems.mockReturnValue([]);
  useShoppingList.setState({ items: [], loaded: false, lastAddedId: null });
});

describe('shopping-list store', () => {
  it('load() reads items from the db and marks itself loaded', () => {
    mockedDb.listItems.mockReturnValue([makeItem()]);
    store().load();
    expect(mockedDb.listItems).toHaveBeenCalledTimes(1);
    expect(store().items).toHaveLength(1);
    expect(store().loaded).toBe(true);
  });

  it('addItem() ignores empty / whitespace-only names', () => {
    store().addItem('   ');
    expect(mockedDb.insertItem).not.toHaveBeenCalled();
  });

  it('addItem() inserts a valid name, refreshes, and records the new id', () => {
    mockedDb.insertItem.mockReturnValue(makeItem({ id: 'new-1', name: 'Eggs' }));
    store().addItem('Eggs');
    expect(mockedDb.insertItem).toHaveBeenCalledWith('Eggs');
    expect(mockedDb.listItems).toHaveBeenCalled();
    expect(store().lastAddedId).toBe('new-1');
  });

  it('renameItem() ignores an empty name but renames a valid one', () => {
    store().renameItem('1', '   ');
    expect(mockedDb.renameItem).not.toHaveBeenCalled();

    store().renameItem('1', 'Oat milk');
    expect(mockedDb.renameItem).toHaveBeenCalledWith('1', 'Oat milk');
  });

  it('toggleBought() marks an unbought item bought', () => {
    useShoppingList.setState({ items: [makeItem({ bought_at: null })] });
    store().toggleBought('1');
    expect(mockedDb.setBought).toHaveBeenCalledWith('1', true);
  });

  it('toggleBought() un-marks an already-bought item', () => {
    useShoppingList.setState({
      items: [makeItem({ bought_at: '2020-01-02T00:00:00.000Z' })],
    });
    store().toggleBought('1');
    expect(mockedDb.setBought).toHaveBeenCalledWith('1', false);
  });

  it('toggleBought() does nothing for an unknown id', () => {
    useShoppingList.setState({ items: [makeItem({ id: '1' })] });
    store().toggleBought('nope');
    expect(mockedDb.setBought).not.toHaveBeenCalled();
  });

  it('deleteItem() soft-deletes via the db', () => {
    store().deleteItem('1');
    expect(mockedDb.softDeleteItem).toHaveBeenCalledWith('1');
  });

  it('clear() soft-deletes everything', () => {
    store().clear();
    expect(mockedDb.softDeleteAll).toHaveBeenCalledTimes(1);
  });

  it('archive() archives everything without deleting', () => {
    store().archive();
    expect(mockedDb.archiveAll).toHaveBeenCalledTimes(1);
    expect(mockedDb.softDeleteAll).not.toHaveBeenCalled();
  });
});
