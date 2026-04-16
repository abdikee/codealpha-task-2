#!/usr/bin/env node

/**
 * Production Setup Script
 * 
 * This script helps you set up the production environment by:
 * 1. Checking environment variables
 * 2. Testing database connection
 * 3. Running migrations
 * 4. Creating necessary directories
 * 5. Verifying the setup
 * 
 * Usage: node setup-production.js
 */

import dotenv from 'dotenv';
import { testConnection, query } from './db.js';
import { readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Check if required environment variables are set
function checkEnvironmentVariables() {
  logSection('1. Checking Environment Variables');
  
  const required = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'COOKIE_SECRET',
  ];
  
  const warnings = [
    'FRONTEND_URL',
  ];
  
  let allPresent = true;
  
  for (const varName of required) {
    if (!process.env[varName]) {
      logError(`Missing required environment variable: ${varName}`);
      allPresent = false;
    } else if (process.env[varName].includes('your_') || process.env[varName].includes('CHANGE_THIS')) {
      logWarning(`${varName} appears to be a placeholder value`);
      allPresent = false;
    } else {
      logSuccess(`${varName} is set`);
    }
  }
  
  for (const varName of warnings) {
    if (!process.env[varName]) {
      logWarning(`Optional variable not set: ${varName}`);
    } else {
      logSuccess(`${varName} is set`);
    }
  }
  
  // Check NODE_ENV
  if (process.env.NODE_ENV !== 'production') {
    logWarning(`NODE_ENV is set to '${process.env.NODE_ENV}' (should be 'production' for production)`);
  } else {
    logSuccess('NODE_ENV is set to production');
  }
  
  return allPresent;
}

// Test database connection
async function checkDatabaseConnection() {
  logSection('2. Testing Database Connection');
  
  try {
    const connected = await testConnection();
    if (connected) {
      logSuccess('Database connection successful');
      
      // Check database version
      const result = await query('SELECT version()');
      logInfo(`PostgreSQL version: ${result.rows[0].version.split(',')[0]}`);
      
      return true;
    } else {
      logError('Database connection failed');
      return false;
    }
  } catch (error) {
    logError(`Database connection error: ${error.message}`);
    return false;
  }
}

// Check if migrations have been run
async function checkMigrations() {
  logSection('3. Checking Database Schema');
  
  try {
    // Check if users table exists
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (result.rows[0].exists) {
      logSuccess('Database schema exists (users table found)');
      
      // Count tables
      const tables = await query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      logInfo(`Found ${tables.rows[0].count} tables in database`);
      
      return true;
    } else {
      logWarning('Database schema not found. Run migrations with: node migrate.js up');
      return false;
    }
  } catch (error) {
    logError(`Error checking migrations: ${error.message}`);
    return false;
  }
}

// Create necessary directories
async function createDirectories() {
  logSection('4. Creating Necessary Directories');
  
  const directories = [
    '../public/images/avatars',
    '../public/images/posts',
    './logs',
  ];
  
  let allCreated = true;
  
  for (const dir of directories) {
    const fullPath = join(__dirname, dir);
    try {
      if (!existsSync(fullPath)) {
        await mkdir(fullPath, { recursive: true });
        logSuccess(`Created directory: ${dir}`);
      } else {
        logInfo(`Directory already exists: ${dir}`);
      }
    } catch (error) {
      logError(`Failed to create directory ${dir}: ${error.message}`);
      allCreated = false;
    }
  }
  
  return allCreated;
}

// Check file permissions
function checkPermissions() {
  logSection('5. Checking File Permissions');
  
  const paths = [
    '../public/images/avatars',
    '../public/images/posts',
    './logs',
  ];
  
  let allWritable = true;
  
  for (const dir of paths) {
    const fullPath = join(__dirname, dir);
    try {
      if (existsSync(fullPath)) {
        // Try to write a test file
        const testFile = join(fullPath, '.write-test');
        const fs = await import('fs/promises');
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        logSuccess(`Directory is writable: ${dir}`);
      }
    } catch (error) {
      logError(`Directory is not writable: ${dir}`);
      allWritable = false;
    }
  }
  
  return allWritable;
}

// Check dependencies
async function checkDependencies() {
  logSection('6. Checking Dependencies');
  
  try {
    const packageJson = await import('./package.json', { assert: { type: 'json' } });
    const dependencies = Object.keys(packageJson.default.dependencies || {});
    
    logInfo(`Found ${dependencies.length} dependencies`);
    
    // Check if node_modules exists
    if (existsSync(join(__dirname, 'node_modules'))) {
      logSuccess('node_modules directory exists');
      return true;
    } else {
      logWarning('node_modules not found. Run: npm install');
      return false;
    }
  } catch (error) {
    logError(`Error checking dependencies: ${error.message}`);
    return false;
  }
}

// Security checks
function securityChecks() {
  logSection('7. Security Checks');
  
  let allSecure = true;
  
  // Check JWT secret strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    logWarning('JWT_SECRET is too short (should be at least 32 characters)');
    allSecure = false;
  } else if (jwtSecret) {
    logSuccess('JWT_SECRET has adequate length');
  }
  
  // Check cookie secret strength
  const cookieSecret = process.env.COOKIE_SECRET;
  if (cookieSecret && cookieSecret.length < 32) {
    logWarning('COOKIE_SECRET is too short (should be at least 32 characters)');
    allSecure = false;
  } else if (cookieSecret) {
    logSuccess('COOKIE_SECRET has adequate length');
  }
  
  // Check if using HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const frontendUrl = process.env.FRONTEND_URL || '';
    if (!frontendUrl.startsWith('https://')) {
      logWarning('FRONTEND_URL should use HTTPS in production');
      allSecure = false;
    } else {
      logSuccess('FRONTEND_URL uses HTTPS');
    }
  }
  
  return allSecure;
}

// Main setup function
async function main() {
  console.clear();
  log('\n🚀 Production Setup Script\n', 'cyan');
  
  const checks = {
    env: false,
    db: false,
    migrations: false,
    directories: false,
    permissions: false,
    dependencies: false,
    security: false,
  };
  
  try {
    checks.env = checkEnvironmentVariables();
    
    if (checks.env) {
      checks.db = await checkDatabaseConnection();
      
      if (checks.db) {
        checks.migrations = await checkMigrations();
      }
    }
    
    checks.directories = await createDirectories();
    checks.permissions = await checkPermissions();
    checks.dependencies = await checkDependencies();
    checks.security = securityChecks();
    
    // Summary
    logSection('Setup Summary');
    
    const results = [
      ['Environment Variables', checks.env],
      ['Database Connection', checks.db],
      ['Database Schema', checks.migrations],
      ['Directories', checks.directories],
      ['Permissions', checks.permissions],
      ['Dependencies', checks.dependencies],
      ['Security', checks.security],
    ];
    
    let allPassed = true;
    for (const [name, passed] of results) {
      if (passed) {
        logSuccess(name);
      } else {
        logError(name);
        allPassed = false;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (allPassed) {
      log('\n✓ All checks passed! Your application is ready for production.\n', 'green');
      log('Next steps:', 'cyan');
      log('1. Start the server: pm2 start ecosystem.config.js --env production');
      log('2. Check status: pm2 status');
      log('3. View logs: pm2 logs social-media-api');
      log('4. Test health endpoint: curl http://localhost:3000/health\n');
    } else {
      log('\n✗ Some checks failed. Please fix the issues above before deploying.\n', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`\nSetup failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
main();
