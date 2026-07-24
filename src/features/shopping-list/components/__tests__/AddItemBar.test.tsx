import { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AddItemBar, type AddItemBarHandle } from '../AddItemBar';

// Controllable keyboard height so tests can simulate show/hide.
let mockKeyboardHeight = 0;
jest.mock('@/shared/hooks/useKeyboardHeight', () => ({
  useKeyboardHeight: () => mockKeyboardHeight,
}));

beforeEach(() => {
  mockKeyboardHeight = 0;
});

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

  it('collapses when the keyboard hides without a blur (e.g. Android back)', () => {
    const onAdd = jest.fn();
    const { getByText, getByPlaceholderText, queryByPlaceholderText, rerender } =
      render(<AddItemBar onAdd={onAdd} />);

    fireEvent.press(getByText('＋ Add item'));
    expect(getByPlaceholderText('Item name')).toBeTruthy();

    // Keyboard appears...
    mockKeyboardHeight = 300;
    rerender(<AddItemBar onAdd={onAdd} />);
    // ...then is dismissed without the input ever blurring.
    mockKeyboardHeight = 0;
    rerender(<AddItemBar onAdd={onAdd} />);

    expect(queryByPlaceholderText('Item name')).toBeNull();
    expect(getByText('＋ Add item')).toBeTruthy();
  });
});
