import { resolve } from 'path';
import { generateKeyPairSync } from 'crypto';
import { writeFileSync } from 'fs';

export function keyCmd(params, options) {
  if (options.includes('--help') || options.includes('-h')) {
    console.log('Usage: walu key <key.pem> <key.pub>');
    console.log('Options:');
    console.log('  --help, -h     Show help information');
    console.log('  --bits <n>     Number of bits for the RSA key (default: 2048)');
    process.exit(0);
  }
  if (params.length !== 2) {
    console.error('Error: Missing required parameters or too many parameters.');
    console.log('Usage: walu key <key.pem> <key.pub>');
    process.exit(1);
  }

  const [privateKeyPath, publicKeyPath] = params
    .map(p => p.trim())
    .map(p => p.startsWith('/') 
      ? p
      : resolve(process.cwd(), p)
    );

  const bitsIndex = options.indexOf('--bits');
  let bits = 2048;
  if (bitsIndex !== -1 && options.length > bitsIndex + 1) {
    const parsedBits = parseInt(options[bitsIndex + 1], 10);
    if (!isNaN(parsedBits) && (parsedBits === 2048 || parsedBits === 4096)) {
      bits = parsedBits;
    } else {
      console.error('Error: --bits option must be followed by 2048 or 4096.');
      process.exit(1);
    }
  }

  console.log(`Generating RSA key pair with ${bits} bits...`);
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: bits,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  try {
    writeFileSync(privateKeyPath, privateKey);
    writeFileSync(publicKeyPath, publicKey);
    console.log(`Private key saved to ${privateKeyPath}`);
    console.log(`Public key saved to ${publicKeyPath}`);
  } catch (error) {
    console.error(`Error writing key files: ${error.message}`);
    process.exit(1);
  }
}
