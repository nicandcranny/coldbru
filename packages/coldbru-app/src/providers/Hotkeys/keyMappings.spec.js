const { describe, it, expect } = require('@jest/globals');
const { DEFAULT_KEY_BINDINGS, getKeyBindingsForActionAllOS } = require('./keyMappings');

describe('keyMappings', () => {
  it('uses shift alt f as default format json shortcut on mac and windows', () => {
    expect(DEFAULT_KEY_BINDINGS.formatJson).toEqual({
      mac: 'shift+bind+alt+bind+f',
      windows: 'shift+bind+alt+bind+f',
      name: 'Format JSON'
    });
  });

  it('returns format json shortcuts for all supported operating systems', () => {
    expect(getKeyBindingsForActionAllOS('formatJson')).toEqual(['shift+alt+f', 'shift+alt+f']);
  });
});
