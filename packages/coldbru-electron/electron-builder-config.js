require('dotenv').config({ path: process.env.DOTENV_PATH });

const macIdentity = process.env.CSC_NAME || process.env.CSC_LINK ? undefined : '-';
const requestedArchs = ['x64', 'arm64'].filter((arch) => process.argv.includes(`--${arch}`));
const resolvedTargetArchs = requestedArchs.length ? requestedArchs : ['x64', 'arm64'];

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
    '!**/._*'
  ],
  afterSign: 'notarize.js',
  mac: {
    artifactName: '${name}_${version}_${arch}_${os}.${ext}',
    category: 'public.app-category.developer-tools',
    target: [
      {
        target: 'dmg',
        arch: resolvedTargetArchs
      },
      {
        target: 'zip',
        arch: resolvedTargetArchs
      }
    ],
    icon: 'resources/icons/png',
    hardenedRuntime: true,
    identity: macIdentity,
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
        arch: resolvedTargetArchs
      },
      {
        target: 'deb',
        arch: resolvedTargetArchs
      },
      {
        target: 'rpm',
        arch: resolvedTargetArchs
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
        arch: resolvedTargetArchs
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
