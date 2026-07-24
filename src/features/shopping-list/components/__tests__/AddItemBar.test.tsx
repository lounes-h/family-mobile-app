import { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AddItemBar, type AddItemBarHandle } from '../AddItemBar';

function setup() {
  const onAdd = jest.fn();
  const ref = createRef<AddItemBarHandle>();
  const utils = render(<AddItemBar ref={ref} onAdd={onAdd} />);
  return { ...utils, onAdd, ref };
}

describe('AddItemBar', () => {
  it('shows only the button by default (input hidden)', () => {
    const { getByText, queryByPlaceholderText } = setup();
    expect(getByText('＋ Add item')).toBeTruthy();
    expect(queryByPlaceholderText('Item name')).toBeNull();
  });

  it('reveals the input when the button is tapped', () => {
    const { getByText, getByPlaceholderText } = setup();
    fireEvent.press(getByText('＋ Add item'));
    expect(getByPlaceholderText('Item name')).toBeTruthy();
  });

  it('opens via the imperative ref handle', () => {
    const { ref, getByPlaceholderText } = setup();
    act(() => ref.current?.open());
    expect(getByPlaceholderText('Item name')).toBeTruthy();
  });

  it('adds a trimmed item and keeps the input open', () => {
    const { getByText, getByPlaceholderText, onAdd } = setup();
    fireEvent.press(getByText('＋ Add item'));
    const input = getByPlaceholderText('Item name');
    fireEvent.changeText(input, '  Eggs  ');
    fireEvent(input, 'submitEditing');
    expect(onAdd).toHaveBeenCalledWith('Eggs');
    // Stays open for the next item.
    expect(getByPlaceholderText('Item name')).toBeTruthy();
  });

  it('ignores an empty submit', () => {
    const { getByText, getByPlaceholderText, onAdd } = setup();
    fireEvent.press(getByText('＋ Add item'));
    const input = getByPlaceholderText('Item name');
    fireEvent.changeText(input, '   ');
    fireEvent(input, 'submitEditing');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('collapses back to the button when the keyboard is dismissed (blur)', () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = setup();
    fireEvent.press(getByText('＋ Add item'));
    fireEvent(getByPlaceholderText('Item name'), 'blur');
    expect(queryByPlaceholderText('Item name')).toBeNull();
    expect(getByText('＋ Add item')).toBeTruthy();
  });
});
