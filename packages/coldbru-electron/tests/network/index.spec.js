jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn()
  },
  app: {
    getPath: jest.fn(() => '/tmp/coldbru-electron-tests'),
    setPath: jest.fn(),
    getVersion: jest.fn(() => '2.0.0'),
    getName: jest.fn(() => 'ColdBru')
  },
  safeStorage: {
    isEncryptionAvailable: jest.fn(() => false),
    encryptString: jest.fn(),
    decryptString: jest.fn()
  }
}));

jest.mock('electron-store', () => {
  return class MockStore {
    constructor() {
      this.data = {};
    }

    get(key, fallbackValue) {
      return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : fallbackValue;
    }

    set(key, value) {
      this.data[key] = value;
      return value;
    }
  };
});

jest.mock('../../src/store/cookies', () => ({
  cookiesStore: {
    initializeCookies: jest.fn(),
    saveCookieJar: jest.fn()
  }
}));

jest.mock('../../src/utils/encryption', () => ({
  encryptString: jest.fn((value) => value),
  decryptString: jest.fn((value) => value),
  encryptStringSafe: jest.fn((value) => ({ success: true, value })),
  decryptStringSafe: jest.fn((value) => ({ success: true, value }))
}));

const { configureRequest } = require('../../src/ipc/network/index');

const describeConfigureRequest
  = process.platform === 'darwin' ? describe.skip : describe;

describeConfigureRequest('index: configureRequest', () => {
  it('Should add \'http://\' to the URL if no protocol is specified', async () => {
    const request = { method: 'GET', url: 'test-domain', body: {} };
    await configureRequest(null, {}, request, null, null, null, null);
    expect(request.url).toEqual('http://test-domain');
  });

  it('Should NOT add \'http://\' to the URL if a protocol is specified', async () => {
    const request = { method: 'GET', url: 'ftp://test-domain', body: {} };
    await configureRequest(null, {}, request, null, null, null, null);
    expect(request.url).toEqual('ftp://test-domain');
  });
});
