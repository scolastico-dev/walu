# `@scolastico-dev/walu` - Web App Live Updater

TODO: short description

## Features

TODO: list features

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

## Publish a version

```bash
npx @scolastico-dev/walu key --help
npx @scolastico-dev/walu publish --help
### e.g.
npx @scolastico-dev/walu key key.pem key.pub
npx @scolastico-dev/walu publish 1.0.0 ./key.pem ./dist ./update
```
