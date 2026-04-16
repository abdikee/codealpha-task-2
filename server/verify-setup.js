import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verifying Express.js Setup...\n');

// Check directories
const directories = [
  '../public',
  '../public/css',
  '../public/js',
  '../public/images',
  '../public/images/avatars',
  '../public/images/posts',
  '../views',
  '.'
];

console.log('📁 Checking directories:');
directories.forEach(dir => {
  const path = join(__dirname, dir);
  const exists = existsSync(path);
  console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
});

// Check files
const files = [
  './server.js',
  './package.json',
  './README.md',
  '../.env',
  '../.env.example'
];

console.log('\n📄 Checking files:');
files.forEach(file => {
  const path = join(__dirname, file);
  const exists = existsSync(path);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Check dependencies
console.log('\n📦 Checking dependencies:');
const requiredDeps = [
  'express',
  'pg',
  'bcrypt',
  'jsonwebtoken',
  'socket.io',
  'cookie-parser',
  'express-validator',
  'multer',
  'redis',
  'ejs',
  'dotenv'
];

try {
  const packageJson = await import('./package.json', { assert: { type: 'json' } });
  const deps = packageJson.default.dependencies;
  
  requiredDeps.forEach(dep => {
    const installed = deps[dep] !== undefined;
    console.log(`  ${installed ? '✅' : '❌'} ${dep} ${installed ? deps[dep] : ''}`);
  });
} catch (error) {
  console.log('  ❌ Could not read package.json');
}

console.log('\n✨ Setup verification complete!\n');
