import archiver from 'archiver';
import semver from 'semver';
import { resolve } from 'path';
import { createHash, createSign } from 'crypto';
import { 
  copyFileSync, 
  existsSync, 
  mkdirSync, 
  rmSync, 
  createWriteStream, 
  readFileSync, 
  writeFileSync 
} from 'fs';

export async function publishCmd(params, options) {
  if (options.includes('--help') || options.includes('-h')) {
    console.log('Usage: walu publish <version> <key.pem> <app-directory-or-zip> <output-directory>');
    console.log('Packages an application directory or zip file, then hashes and signs it to create an update.');
    console.log('Options:');
    console.log('  --help, -h          Show help information');
    console.log('  --no-semver-check   Skip semver version validation');
    process.exit(0);
  }
  
  if (params.length !== 4) {
    console.error('Error: Incorrect number of parameters.');
    console.log('Usage: walu publish <version> <key.pem> <app-directory-or-zip> <output-directory>');
    process.exit(1);
  }

  const version = params[0].trim();
  const [privateKeyPath, appPath, outputDir] = params.slice(1)
    .map(p => p.trim())
    .map(p => p.startsWith('/') 
      ? p 
      : resolve(process.cwd(), p)
    );

  const updateBinPath = resolve(outputDir, 'update.bin');
  const updateBundlePath = resolve(outputDir, 'update.bundle');
  const versionJsonPath = resolve(outputDir, 'version.json');

  if (!semver.valid(version) && !options.includes('--no-semver-check')) {
    console.error(`Error: Invalid version string "${version}". Must be a valid semver version.`);
    console.log('Use --no-semver-check to override.');
    process.exit(1);
  }

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  if (existsSync(updateBinPath)) rmSync(updateBinPath);
  if (existsSync(updateBundlePath)) rmSync(updateBundlePath);
  if (existsSync(versionJsonPath)) rmSync(versionJsonPath);

  try {
    console.log(`Creating update package from ${appPath}...`);
    if (appPath.endsWith('.zip')) {
      if (!existsSync(appPath)) {
        throw new Error(`Input ZIP file not found at ${appPath}`);
      }
      copyFileSync(appPath, updateBinPath);
      console.log(`   Copied ${appPath} to ${updateBinPath}`);
    } else {
      await new Promise((resolvePromise, rejectPromise) => {
        const output = createWriteStream(updateBinPath);
        const archive = archiver('zip');

        output.on('close', () => {
          console.log(`   App directory successfully zipped to ${updateBinPath}`);
          resolvePromise();
        });

        archive.on('error', (err) => rejectPromise(err));

        archive.pipe(output);
        archive.directory(appPath, false);
        archive.finalize();
      });
    }

    console.log('Calculating package hash (SHA-256)...');
    const fileBuffer = readFileSync(updateBinPath);
    const hashSum = createHash('sha256');
    hashSum.update(fileBuffer);
    const hexHash = hashSum.digest('hex');
    console.log(`   Hash: ${hexHash}`);

    console.log('Calculating version hash (SHA-256)...');
    const versionHashSum = createHash('sha256');
    versionHashSum.update(hexHash + version);
    const versionHexHash = versionHashSum.digest('hex');
    console.log(`   Version Hash: ${versionHexHash}`);

    console.log(`Signing hash with private key from ${privateKeyPath}...`);
    if (!existsSync(privateKeyPath)) throw new Error(`Private key not found at ${privateKeyPath}`);
    const privateKey = readFileSync(privateKeyPath);
    const signer = createSign('RSA-SHA256');
    signer.update(versionHexHash);
    signer.end();
    const signature = signer.sign(privateKey, 'base64');
    console.log('   Signature created successfully.');

    const versionInfo = {
      version,
      hash: versionHexHash,
      signature,
    };
    writeFileSync(versionJsonPath, JSON.stringify(versionInfo, null, 2));
    console.log(`version.json file created at ${versionJsonPath}`);

    console.log('Creating update.bundle...');
    await new Promise((resolvePromise, rejectPromise) => {
      const output = createWriteStream(updateBundlePath);
      const archive = archiver('zip');

      output.on('close', () => {
        console.log('   update.bundle created successfully.');
        resolvePromise();
      });
      
      archive.on('error', (err) => rejectPromise(err));
      archive.pipe(output);
      archive.file(updateBinPath, { name: 'update.bin' });
      archive.file(versionJsonPath, { name: 'version.json' });
      archive.finalize();
    });

    console.log('Publish process completed successfully!');
  } catch (err) {
    console.error(`Error during publish process: ${err.message}`);
    if (existsSync(updateBinPath)) rmSync(updateBinPath);
    if (existsSync(updateBundlePath)) rmSync(updateBundlePath);
    if (existsSync(versionJsonPath)) rmSync(versionJsonPath);
    process.exit(1);
  }
}
