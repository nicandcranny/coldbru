import { createHotkeyStopCallback } from './index';

describe('createHotkeyStopCallback', () => {
  it('allows command palette inside text inputs', () => {
    const defaultStopCallback = jest.fn(() => true);
    const stopCallback = createHotkeyStopCallback({}, defaultStopCallback);
    const input = document.createElement('input');

    expect(stopCallback(null, input, 'command+shift+p')).toBe(false);
    expect(defaultStopCallback).not.toHaveBeenCalled();
  });

  it('allows global search inside textareas', () => {
    const defaultStopCallback = jest.fn(() => true);
    const stopCallback = createHotkeyStopCallback({}, defaultStopCallback);
    const textarea = document.createElement('textarea');

    expect(stopCallback(null, textarea, 'command+k')).toBe(false);
    expect(defaultStopCallback).not.toHaveBeenCalled();
  });

  it('keeps default Mousetrap blocking for other shortcuts in inputs', () => {
    const defaultStopCallback = jest.fn(() => true);
    const stopCallback = createHotkeyStopCallback({}, defaultStopCallback);
    const input = document.createElement('input');

    expect(stopCallback(null, input, 'command+s')).toBe(true);
    expect(defaultStopCallback).toHaveBeenCalledWith(null, input, 'command+s');
  });

  it('respects custom keybindings for input-enabled shortcuts', () => {
    const defaultStopCallback = jest.fn(() => true);
    const stopCallback = createHotkeyStopCallback({
      commandPalette: {
        mac: 'command+bind+p'
      }
    }, defaultStopCallback);
    const input = document.createElement('input');

    expect(stopCallback(null, input, 'command+p')).toBe(false);
    expect(defaultStopCallback).not.toHaveBeenCalled();
  });

  it('uses provided default stop callback implementation', () => {
    const defaultStopCallback = jest.fn(() => 'fallback-result');
    const stopCallback = createHotkeyStopCallback({}, defaultStopCallback);
    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });

    expect(stopCallback(event, input, 'command+s')).toBe('fallback-result');

    expect(defaultStopCallback).toHaveBeenCalledWith(event, input, 'command+s');
  });
});
