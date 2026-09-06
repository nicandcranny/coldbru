require('dotenv').config({ path: process.env.DOTENV_PATH });
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const electron_notarize = require('electron-notarize');

function applyAdHocSignature(params) {
  if (process.env.CSC_NAME || process.env.CSC_LINK) {
    return;
  }

  const appPath = path.join(
    params.appOutDir,
    `${params.packager.appInfo.productFilename}.app`
  );
  if (!fs.existsSync(appPath)) {
    console.error(`Cannot find application at: ${appPath}`);
    return;
  }

  console.log(`Applying consistent ad-hoc signature to ${appPath}`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], {
    stdio: 'inherit'
  });
}

const notarize = async (params) => {
  if (
    process.platform !== 'darwin'
    || params.packager.platform.nodeName !== 'darwin'
  ) {
    return;
  }

  applyAdHocSignature(params);

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_ID_PASSWORD;

  if (process.env.SKIP_NOTARIZE === 'true') {
    console.log('Skipping notarization because SKIP_NOTARIZE=true');
    return;
  }

  if (!appleId || !appleIdPassword) {
    console.log(
      'Skipping notarization because APPLE_ID / APPLE_ID_PASSWORD are not configured'
    );
    return;
  }

  const appId = 'com.coldbru.app';

  const appPath = path.join(
    params.appOutDir,
    `${params.packager.appInfo.productFilename}.app`
  );
  if (!fs.existsSync(appPath)) {
    console.error(`Cannot find application at: ${appPath}`);
    return;
  }

  console.log(
    `Notarizing ${appId} found at ${appPath} using Apple ID ${appleId}`
  );

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
