require('dotenv').config({ path: process.env.DOTENV_PATH });

const config = {
  appId: 'com.coldbru.app',
  productName: 'ColdBru',
  electronVersion: '41.2.1',
  directories: {
    buildResources: 'resources',
    output: 'out'
  },
  extraResources: [
    {
      from: 'resources/data/sample-collection.json',
      to: 'data/sample-collection.json'
    }
  ],
  files: [
    'src/**/*',
    'web/**/*',
    'resources/**/*',
    'package.json',
    'notarize.js',
    '!dist{,/**}',
    '!out{,/**}',
    '!out-verify{,/**}',
    '!tests{,/**}',
    '!**/.DS_Store',
    '!**/*.map',
    '!**/*.md',
    '!**/._*',
    '!node_modules/.bin{,/**}',
    '!node_modules/**/{test,tests,__tests__,powered-test,example,examples,docs,doc,website,benchmark,benchmarks,coverage,.nyc_output}{,/**}',
    '!node_modules/**/*.d.ts',
    '!node_modules/**/*.ts',
    '!node_modules/**/*.tsx',
    '!node_modules/**/tsconfig*.json',
    '!node_modules/**/{CHANGELOG,CHANGES,README,readme,AUTHORS,CONTRIBUTORS}.{md,markdown,txt}',
    '!node_modules/electron{,/**}',
    '!node_modules/electron-builder{,/**}',
    '!node_modules/app-builder-{bin,lib}{,/**}',
    '!node_modules/dmg-builder{,/**}',
    '!node_modules/electron-publish{,/**}',
    '!node_modules/@electron{,/**}'
  ],
  afterSign: 'notarize.js',
  mac: {
    artifactName: '${name}_${version}_${arch}_${os}.${ext}',
    category: 'public.app-category.developer-tools',
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'resources/icons/png',
    hardenedRuntime: true,
    identity: 'Anoop MD (W7LPPWA48L)',
    entitlements: 'resources/entitlements.mac.plist',
    entitlementsInherit: 'resources/entitlements.mac.plist',
    notarize: false,
    protocols: [
      {
        name: 'ColdBru',
        schemes: [
          'coldbru'
        ]
      }
    ]
  },
  linux: {
    artifactName: '${name}_${version}_${arch}_${os}.${ext}',
    icon: 'resources/icons/png',
    mimeTypes: ['x-scheme-handler/coldbru'],
    target: [
      {
        target: 'AppImage',
        arch: ['x64', 'arm64']
      },
      {
        target: 'deb',
        arch: ['x64', 'arm64']
      },
      {
        target: 'rpm',
        arch: ['x64', 'arm64']
      }
    ],
    protocols: [
      {
        name: 'ColdBru',
        schemes: ['coldbru']
      }
    ],
    category: 'Development'
  },
  deb: {
    // Docs: https://www.electron.build/configuration/linux#debian-package-options
    depends: [
      'libgtk-3-0',
      'libnotify4',
      'libnss3',
      'libxss1',
      'libxtst6',
      'xdg-utils',
      'libatspi2.0-0',
      'libuuid1',
      'libsecret-1-0',
      'libasound2' // #1036
    ]
  },
  win: {
    artifactName: '${name}_${version}_${arch}_win.${ext}',
    icon: 'resources/icons/win/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'arm64']
      }
    ]
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  }
};

module.exports = config;
