# Web App Live Updater

[![npm version](https://badge.fury.io/js/%40scolastico-dev%2Fwalu.svg)](https://badge.fury.io/js/%40scolastico-dev%2Fwalu)
[![npm downloads](https://img.shields.io/npm/dm/@scolastico-dev/walu.svg)](https://www.npmjs.com/package/@scolastico-dev/walu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

WALU is a library to add live update capabilities to your web application. It works by checking for update binaries and a version file on your server, downloading the update to a storage of your choice, validating it using RSA signatures, and applying the update by starting a service worker that replaces the current page with the updated version.

*Note that this library does work in normal web browsers, but it is primarily designed for use in WebView-based applications, such as those built with Electron, Tauri, or Capacitor.*

## Features

- Check for updates from a specified server
- Ask for a single `<update>.bundle` file for manual updating, development or downgrading.
- Checks SHA-256 hash of the downloaded file against the version file.
- Checks RSA signature of the version file against a provided public key.
- Provides status callbacks for implementing a progress bar or similar.
- Uses a service worker to apply the update by reloading the page with the new content.
- Supports custom storage mechanisms for the downloaded update (e.g., IndexedDB, localStorage, capacitor Filesystem, etc.)
- Easy to integrate into existing web applications.

## Installation

```bash
npm install @scolastico-dev/walu
```

## Usage

Add the following code to your application startup code:

```typescript
import { WaluConfig, installWalu } from '@scolastico-dev/walu';

installWalu(new WaluConfig(
  workerPath: '/walu-worker.js',
  publicKey: [
    '-----BEGIN PUBLIC KEY-----',
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCA',
    '[...your rsa public key...]',
    '-----END PUBLIC KEY-----',
  ].join('\n'),
  apiUrls: {
    versionJson: 'https://example.com/path/to/version.json',
    updateBin: 'https://example.com/path/to/update.bin',
  },
)).then(() => {});
```

Make sure to host the `walu-worker.js` so it is accessible at the path you specify in `workerPath`.

```bash
npx @scolastico-dev/walu worker ./public/walu-worker.js
```

To achieve this, we recommend adding the command to your `package.json` scripts:

```json
{
  "scripts": {
    "postinstall": "walu worker ./public/walu-worker.js"
  }
}
```

## Publish a version

```bash
npx @scolastico-dev/walu key --help
# npx @scolastico-dev/walu key <privateKeyFile> <publicKeyFile>

npx @scolastico-dev/walu publish --help
# npx @scolastico-dev/walu publish <version> <privateKeyFile> <sourceDir> <outputDir>

### e.g.
npx @scolastico-dev/walu key key.pem key.pub
npx @scolastico-dev/walu publish 1.0.0 ./key.pem ./dist ./update
```
