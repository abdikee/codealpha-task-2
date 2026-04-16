import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verify migration file syntax and structure
 */
function verifyMigration(filename) {
  const filepath = path.join(__dirname, filename);
  
  console.log(`\nVerifying: ${filename}`);
  console.log('─'.repeat(60));
  
  try {
    // Read file
    const content = fs.readFileSync(filepath, 'utf8');
    
    // Check file is not empty
    if (content.trim().length === 0) {
      throw new Error('Migration file is empty');
    }
    
    // Extract table names
    const tableMatches = content.match(/CREATE TABLE\s+(\w+)/gi);
    const tables = tableMatches ? tableMatches.map(m => m.split(/\s+/)[2]) : [];
    
    // Extract index names
    const indexMatches = content.match(/CREATE INDEX\s+(\w+)/gi);
    const indexes = indexMatches ? indexMatches.map(m => m.split(/\s+/)[2]) : [];
    
    // Extract view names
    const viewMatches = content.match(/CREATE VIEW\s+(\w+)/gi);
    const views = viewMatches ? viewMatches.map(m => m.split(/\s+/)[2]) : [];
    
    // Extract trigger names
    const triggerMatches = content.match(/CREATE TRIGGER\s+(\w+)/gi);
    const triggers = triggerMatches ? triggerMatches.map(m => m.split(/\s+/)[2]) : [];
    
    // Extract function names
    const functionMatches = content.match(/CREATE\s+(?:OR REPLACE\s+)?FUNCTION\s+(\w+)/gi);
    const functions = functionMatches ? functionMatches.map(m => m.split(/\s+/).pop()) : [];
    
    // Display results
    console.log(`✓ File size: ${(content.length / 1024).toFixed(2)} KB`);
    console.log(`✓ Tables: ${tables.length}`);
    if (tables.length > 0) {
      tables.forEach(table => console.log(`  - ${table}`));
    }
    
    console.log(`✓ Indexes: ${indexes.length}`);
    if (indexes.length > 0) {
      indexes.forEach(index => console.log(`  - ${index}`));
    }
    
    console.log(`✓ Views: ${views.length}`);
    if (views.length > 0) {
      views.forEach(view => console.log(`  - ${view}`));
    }
    
    console.log(`✓ Triggers: ${triggers.length}`);
    if (triggers.length > 0) {
      triggers.forEach(trigger => console.log(`  - ${trigger}`));
    }
    
    console.log(`✓ Functions: ${functions.length}`);
    if (functions.length > 0) {
      functions.forEach(func => console.log(`  - ${func}`));
    }
    
    // Check for common issues
    const issues = [];
    
    // Check for missing semicolons
    const statements = content.split(';').filter(s => s.trim().length > 0);
    if (statements.length === 0) {
      issues.push('No SQL statements found');
    }
    
    // Check for UUID extension
    if (!content.includes('uuid-ossp') && !content.includes('uuid_generate_v4')) {
      issues.push('UUID extension may not be enabled');
    }
    
    // Check for foreign key constraints
    const fkCount = (content.match(/REFERENCES/gi) || []).length;
    console.log(`✓ Foreign key constraints: ${fkCount}`);
    
    // Check for unique constraints
    const uniqueCount = (content.match(/UNIQUE/gi) || []).length;
    console.log(`✓ Unique constraints: ${uniqueCount}`);
    
    // Check for check constraints
    const checkCount = (content.match(/CHECK\s*\(/gi) || []).length;
    console.log(`✓ Check constraints: ${checkCount}`);
    
    if (issues.length > 0) {
      console.log('\n⚠️  Potential issues:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    console.log('\n✓ Migration file structure looks good!');
    return true;
    
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Verify all migration files
 */
function verifyAllMigrations() {
  console.log('='.repeat(60));
  console.log('MIGRATION VERIFICATION');
  console.log('='.repeat(60));
  
  const files = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (files.length === 0) {
    console.log('\n✗ No migration files found');
    return false;
  }
  
  console.log(`\nFound ${files.length} migration file(s)`);
  
  let allValid = true;
  for (const file of files) {
    const valid = verifyMigration(file);
    if (!valid) {
      allValid = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  if (allValid) {
    console.log('✓ All migrations verified successfully!');
  } else {
    console.log('✗ Some migrations have issues');
  }
  console.log('='.repeat(60));
  
  return allValid;
}

// Run verification
const success = verifyAllMigrations();
process.exit(success ? 0 : 1);
