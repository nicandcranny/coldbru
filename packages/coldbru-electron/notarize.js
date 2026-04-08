require('dotenv').config({ path: process.env.DOTENV_PATH });
const fs = require('fs');
const path = require('path');
const electron_notarize = require('electron-notarize');

const notarize = async function (params) {
  if (process.platform !== 'darwin') {
    return;
  }

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_ID_PASSWORD;

  if (process.env.SKIP_NOTARIZE === 'true') {
    console.log('Skipping notarization because SKIP_NOTARIZE=true');
    return;
  }

  if (!appleId || !appleIdPassword) {
    console.log('Skipping notarization because APPLE_ID / APPLE_ID_PASSWORD are not configured');
    return;
  }

  let appId = 'com.coldbru.app';

  let appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) {
    console.error(`Cannot find application at: ${appPath}`);
    return;
  }

  console.log(`Notarizing ${appId} found at ${appPath} using Apple ID ${appleId}`);

  try {
    await electron_notarize.notarize({
      appBundleId: appId,
      appPath: appPath,
      appleId,
      appleIdPassword,
      ascProvider: 'W7LPPWA48L'
    });
  } catch (error) {
    console.error(error);
  }

  console.log(`Done notarizing ${appId}`);
};

module.exports = notarize;
