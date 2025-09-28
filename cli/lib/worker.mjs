import { SERVICE_WORKER_SOURCE } from '../../dist/index.mjs';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

export function workerCmd(params, options) {
  if (options.includes('--help') || options.includes('-h')) {
    console.log('Usage: walu worker <worker.js>');
    console.log('Generates the service worker script which needs to be hosted alongside your application.');
    console.log('Options:');
    console.log('  --help, -h     Show help information');
    process.exit(0);
  }
  if (params.length !== 1) {
    console.error('Error: Missing required parameters or too many parameters.');
    console.log('Usage: walu worker <worker.js>');
    process.exit(1);
  }

  const [workerPath] = params
    .map(p => p.trim())
    .map(p => p.startsWith('/') 
      ? p
      : resolve(process.cwd(), p)
    );

  try {
    writeFileSync(workerPath, SERVICE_WORKER_SOURCE);
    console.log(`Service worker script saved to ${workerPath}`);
  } catch (error) {
    console.error(`Error writing worker file: ${error.message}`);
    process.exit(1);
  }
}
