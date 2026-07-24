import { fireEvent, render } from '@testing-library/react-native';
import { ShoppingItemRow } from '../ShoppingItemRow';
import type { ShoppingItem } from '../../types';

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

function setup(item: ShoppingItem) {
  const onRename = jest.fn();
  const onToggleBought = jest.fn();
  const onDelete = jest.fn();
  const utils = render(
    <ShoppingItemRow
      item={item}
      onRename={onRename}
      onToggleBought={onToggleBought}
      onDelete={onDelete}
    />,
  );
  return { ...utils, onRename, onToggleBought, onDelete };
}

describe('ShoppingItemRow (not bought)', () => {
  it('tapping the name opens an in-place editor', () => {
    const { getByText, getByDisplayValue } = setup(makeItem());
    fireEvent.press(getByText('Milk'));
    expect(getByDisplayValue('Milk')).toBeTruthy();
  });

  it('confirming a rename calls onRename with the new name', () => {
    const { getByText, getByDisplayValue, getByLabelText, onRename } = setup(
      makeItem(),
    );
    fireEvent.press(getByText('Milk'));
    fireEvent.changeText(getByDisplayValue('Milk'), 'Oat milk');
    fireEvent.press(getByLabelText('Save Milk'));
    expect(onRename).toHaveBeenCalledWith('1', 'Oat milk');
  });

  it('tapping away (blur) discards the edit', () => {
    const { getByText, getByDisplayValue, onRename } = setup(makeItem());
    fireEvent.press(getByText('Milk'));
    const input = getByDisplayValue('Milk');
    fireEvent.changeText(input, 'Oat milk');
    fireEvent(input, 'blur');
    expect(onRename).not.toHaveBeenCalled();
  });

  it('an empty rename is not saved', () => {
    const { getByText, getByDisplayValue, getByLabelText, onRename } = setup(
      makeItem(),
    );
    fireEvent.press(getByText('Milk'));
    fireEvent.changeText(getByDisplayValue('Milk'), '   ');
    fireEvent.press(getByLabelText('Save Milk'));
    expect(onRename).not.toHaveBeenCalled();
  });

  it('the delete control deletes the item', () => {
    const { getByLabelText, onDelete } = setup(makeItem());
    fireEvent.press(getByLabelText('Delete Milk'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('tapping the circle toggles bought', () => {
    const { getByLabelText, onToggleBought } = setup(makeItem());
    fireEvent.press(getByLabelText('Mark Milk bought'));
    expect(onToggleBought).toHaveBeenCalledWith('1');
  });
});

describe('ShoppingItemRow (bought)', () => {
  const bought = () => makeItem({ bought_at: '2020-01-02T00:00:00.000Z' });

  it('cannot be edited — tapping the name does nothing', () => {
    const { getByText, queryByDisplayValue } = setup(bought());
    fireEvent.press(getByText('Milk'));
    expect(queryByDisplayValue('Milk')).toBeNull();
  });

  it('has no delete control', () => {
    const { queryByLabelText } = setup(bought());
    expect(queryByLabelText('Delete Milk')).toBeNull();
  });

  it('can still be un-marked via the circle', () => {
    const { getByLabelText, onToggleBought } = setup(bought());
    fireEvent.press(getByLabelText('Mark Milk not bought'));
    expect(onToggleBought).toHaveBeenCalledWith('1');
  });
});
