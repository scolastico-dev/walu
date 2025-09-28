import { keyCmd } from './lib/key.mjs';
import { publishCmd } from './lib/publish.mjs';
import { workerCmd } from './lib/worker.mjs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: walu <command> [options]');
  console.log('Commands:');
  console.log('  publish   Publish the app to the hosting service');
  console.log('  key       Generate a new RSA key pair');
  process.exit(1);
}

const command = args[0];
const left = args.slice(1);
const options = left.filter(arg => arg.startsWith('-'));
const params = left.filter(arg => !arg.startsWith('-'));

switch (command) {
  case 'publish':
    publishCmd(params, options);
    break;
  case 'key':
    keyCmd(params, options);
    break;
  case 'worker':
    workerCmd(params, options);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
