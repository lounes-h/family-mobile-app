import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ShoppingList } from '../ShoppingList';
import { useShoppingList } from '../../store';
import type { ShoppingItem } from '../../types';

jest.mock('../../store');
const mockedUseShoppingList = useShoppingList as unknown as jest.Mock;

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

function mockStore(items: ShoppingItem[]) {
  const actions = {
    load: jest.fn(),
    addItem: jest.fn(),
    renameItem: jest.fn(),
    toggleBought: jest.fn(),
    deleteItem: jest.fn(),
    archive: jest.fn(),
    clear: jest.fn(),
  };
  mockedUseShoppingList.mockReturnValue({ items, loaded: true, ...actions });
  return actions;
}

const buttonsOf = (spy: jest.SpyInstance) =>
  spy.mock.calls[0][2] as { text: string; onPress?: () => void }[];

afterEach(() => jest.clearAllMocks());

describe('ShoppingList — finish-shopping flow', () => {
  it('prompts to archive when the last unbought item is checked', () => {
    // One bought, one unbought (the last one).
    mockStore([
      makeItem({ id: '1', name: 'Milk', bought_at: '2020-01-02T00:00:00.000Z' }),
      makeItem({ id: '2', name: 'Eggs', bought_at: null }),
    ]);
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByLabelText } = render(<ShoppingList />);

    fireEvent.press(getByLabelText('Mark Eggs bought'));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe('Done shopping?');
  });

  it('archives when Yes is chosen', () => {
    const actions = mockStore([makeItem({ id: '2', name: 'Eggs', bought_at: null })]);
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByLabelText } = render(<ShoppingList />);

    fireEvent.press(getByLabelText('Mark Eggs bought'));
    const yes = buttonsOf(alertSpy).find((b) => b.text === 'Yes');
    act(() => yes?.onPress?.());

    expect(actions.archive).toHaveBeenCalledTimes(1);
  });

  it('reverts the item when "Still shopping" is chosen', () => {
    const actions = mockStore([makeItem({ id: '2', name: 'Eggs', bought_at: null })]);
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByLabelText } = render(<ShoppingList />);

    fireEvent.press(getByLabelText('Mark Eggs bought'));
    // First call: the initial mark-bought.
    expect(actions.toggleBought).toHaveBeenNthCalledWith(1, '2');

    const still = buttonsOf(alertSpy).find((b) => b.text === 'Still shopping');
    act(() => still?.onPress?.());

    // Second call reverts the same item back to unbought.
    expect(actions.toggleBought).toHaveBeenNthCalledWith(2, '2');
    expect(actions.archive).not.toHaveBeenCalled();
  });

  it('does not prompt when other unbought items remain', () => {
    mockStore([
      makeItem({ id: '1', name: 'Milk', bought_at: null }),
      makeItem({ id: '2', name: 'Eggs', bought_at: null }),
    ]);
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByLabelText } = render(<ShoppingList />);

    fireEvent.press(getByLabelText('Mark Milk bought'));

    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('ShoppingList — clear', () => {
  it('confirms with a delete-titled dialog and clears on Yes', () => {
    const actions = mockStore([makeItem({ id: '1', name: 'Milk' })]);
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<ShoppingList />);

    fireEvent.press(getByText('Clear'));

    expect(alertSpy.mock.calls[0][0]).toBe('Delete list and all its items');
    const yes = buttonsOf(alertSpy).find((b) => b.text === 'Yes');
    act(() => yes?.onPress?.());
    expect(actions.clear).toHaveBeenCalledTimes(1);
  });

  it('does nothing on No', () => {
    const actions = mockStore([makeItem({ id: '1', name: 'Milk' })]);
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<ShoppingList />);

    fireEvent.press(getByText('Clear'));
    const no = buttonsOf(alertSpy).find((b) => b.text === 'No');
    act(() => no?.onPress?.());
    expect(actions.clear).not.toHaveBeenCalled();
  });
});
