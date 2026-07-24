import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Current on-screen keyboard height (0 when hidden). With Android edge-to-edge
// (the Expo SDK 54 default) the window doesn't resize when the keyboard opens,
// so a bottom-anchored bar has to lift itself by this height to sit right on
// top of the keyboard. Works in Expo Go — no native module needed.
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // iOS gets the smoother "will" events; Android only fires the "did" ones.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
