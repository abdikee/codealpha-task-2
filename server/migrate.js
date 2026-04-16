import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, testConnection, closePool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;
  
  try {
    await query(sql);
    console.log('✓ Migrations tracking table ready');
  } catch (error) {
    console.error('✗ Failed to create migrations table:', error.message);
    throw error;
  }
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations() {
  try {
    const result = await query('SELECT migration_name FROM schema_migrations ORDER BY id');
    return result.rows.map(row => row.migration_name);
  } catch (error) {
    console.error('✗ Failed to get applied migrations:', error.message);
    throw error;
  }
}

/**
 * Get list of migration files
 */
function getMigrationFiles() {
  try {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log('No migrations directory found');
      return [];
    }
    
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    return files;
  } catch (error) {
    console.error('✗ Failed to read migrations directory:', error.message);
    throw error;
  }
}

/**
 * Apply a single migration
 */
async function applyMigration(filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  
  try {
    console.log(`\nApplying migration: ${filename}`);
    
    // Read migration file
    const sql = fs.readFileSync(filepath, 'utf8');
    
    // Execute migration
    await query(sql);
    
    // Record migration
    await query(
      'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
      [filename]
    );
    
    console.log(`✓ Successfully applied: ${filename}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to apply migration ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations() {
  console.log('='.repeat(60));
  console.log('DATABASE MIGRATION');
  console.log('='.repeat(60));
  
  try {
    // Test database connection
    console.log('\nTesting database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Create migrations table
    console.log('\nInitializing migrations tracking...');
    await createMigrationsTable();
    
    // Get applied and pending migrations
    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = getMigrationFiles();
    
    console.log(`\nFound ${migrationFiles.length} migration file(s)`);
    console.log(`Already applied: ${appliedMigrations.length} migration(s)`);
    
    // Filter pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('\n✓ No pending migrations. Database is up to date.');
      return;
    }
    
    console.log(`\nPending migrations: ${pendingMigrations.length}`);
    console.log('─'.repeat(60));
    
    // Apply each pending migration
    for (const migration of pendingMigrations) {
      await applyMigration(migration);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ All migrations completed successfully!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Migration failed:', error.message);
    console.error('='.repeat(60));
    process.exit(1);
  } finally {
    await closePool();
  }
}

/**
 * Rollback last migration (for development)
 */
async function rollbackLastMigration() {
  console.log('='.repeat(60));
  console.log('ROLLBACK LAST MIGRATION');
  console.log('='.repeat(60));
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Get last applied migration
    const result = await query(
      'SELECT migration_name FROM schema_migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      console.log('\n✓ No migrations to rollback');
      return;
    }
    
    const lastMigration = result.rows[0].migration_name;
    console.log(`\nLast migration: ${lastMigration}`);
    console.log('\n⚠️  WARNING: Rollback will drop all tables!');
    console.log('This is a destructive operation and cannot be undone.');
    
    // For safety, require explicit confirmation
    console.log('\nTo rollback, you must manually:');
    console.log('1. Drop all tables');
    console.log('2. Delete from schema_migrations');
    console.log('3. Re-run migrations');
    
  } catch (error) {
    console.error('\n✗ Rollback failed:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  console.log('='.repeat(60));
  console.log('MIGRATION STATUS');
  console.log('='.repeat(60));
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Create migrations table if needed
    await createMigrationsTable();
    
    // Get applied and available migrations
    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = getMigrationFiles();
    
    console.log(`\nTotal migration files: ${migrationFiles.length}`);
    console.log(`Applied migrations: ${appliedMigrations.length}`);
    console.log(`Pending migrations: ${migrationFiles.length - appliedMigrations.length}`);
    
    if (migrationFiles.length > 0) {
      console.log('\n' + '─'.repeat(60));
      console.log('Migration Files:');
      console.log('─'.repeat(60));
      
      migrationFiles.forEach(file => {
        const status = appliedMigrations.includes(file) ? '✓ Applied' : '○ Pending';
        console.log(`${status}  ${file}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n✗ Failed to get status:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'up':
  case 'migrate':
    runMigrations();
    break;
  case 'status':
    showStatus();
    break;
  case 'rollback':
    rollbackLastMigration();
    break;
  default:
    console.log('Database Migration Tool');
    console.log('\nUsage:');
    console.log('  node migrate.js up       - Run all pending migrations');
    console.log('  node migrate.js status   - Show migration status');
    console.log('  node migrate.js rollback - Show rollback instructions');
    console.log('\nExamples:');
    console.log('  node migrate.js up');
    console.log('  node migrate.js status');
    process.exit(0);
}
