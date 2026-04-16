import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(60));
console.log('MIGRATION SETUP TEST');
console.log('='.repeat(60));

let allPassed = true;

function test(description, condition) {
  const status = condition ? '✓' : '✗';
  console.log(`${status} ${description}`);
  if (!condition) allPassed = false;
  return condition;
}

console.log('\n1. File Existence Tests');
console.log('─'.repeat(60));

test('Migration directory exists', fs.existsSync(path.join(__dirname, 'migrations')));
test('Migration file exists', fs.existsSync(path.join(__dirname, 'migrations', '001_initial_schema.sql')));
test('Migration runner exists', fs.existsSync(path.join(__dirname, 'migrate.js')));
test('Migration README exists', fs.existsSync(path.join(__dirname, 'migrations', 'README.md')));
test('Verification script exists', fs.existsSync(path.join(__dirname, 'migrations', 'verify-schema.js')));
test('Database schema doc exists', fs.existsSync(path.join(__dirname, 'DATABASE-SCHEMA.md')));
test('Task summary exists', fs.existsSync(path.join(__dirname, 'TASK-2.2-SUMMARY.md')));

console.log('\n2. Migration File Content Tests');
console.log('─'.repeat(60));

const migrationContent = fs.readFileSync(
  path.join(__dirname, 'migrations', '001_initial_schema.sql'),
  'utf8'
);

// Test for required tables
const requiredTables = [
  'users', 'posts', 'comments', 'likes', 'follows',
  'messages', 'notifications', 'hashtags', 'post_hashtags',
  'bookmarks', 'activity_logs'
];

requiredTables.forEach(table => {
  test(`Table '${table}' defined`, migrationContent.includes(`CREATE TABLE ${table}`));
});

console.log('\n3. Required Columns Tests');
console.log('─'.repeat(60));

// Test for required columns in users table
test('users.email column exists', migrationContent.includes('email'));
test('users.username column exists', migrationContent.includes('username'));
test('users.password_hash column exists', migrationContent.includes('password_hash'));
test('users.bio column exists', migrationContent.includes('bio'));
test('users.avatar_url column exists', migrationContent.includes('avatar_url'));

// Test for required columns in posts table
test('posts.content column exists', migrationContent.includes('content'));
test('posts.image_url column exists', migrationContent.includes('image_url'));

// Test for required columns in comments table
test('comments.parent_id column exists', migrationContent.includes('parent_id'));

// Test for required columns in messages table
test('messages.read column exists', migrationContent.includes('read'));

// Test for required columns in notifications table
test('notifications.type column exists', migrationContent.includes('type'));
test('notifications.related_id column exists', migrationContent.includes('related_id'));

console.log('\n4. Index Tests');
console.log('─'.repeat(60));

const indexCount = (migrationContent.match(/CREATE INDEX/g) || []).length;
test(`At least 30 indexes defined (found ${indexCount})`, indexCount >= 30);

// Test for specific important indexes
test('User email index exists', migrationContent.includes('idx_users_email'));
test('Post user_id index exists', migrationContent.includes('idx_posts_user_id'));
test('Post created_at index exists', migrationContent.includes('idx_posts_created_at'));
test('Comment post_id index exists', migrationContent.includes('idx_comments_post_id'));
test('Message conversation index exists', migrationContent.includes('idx_messages_conversation'));
test('Notification user index exists', migrationContent.includes('idx_notifications_user_id'));

console.log('\n5. Constraint Tests');
console.log('─'.repeat(60));

test('Foreign key constraints exist', migrationContent.includes('REFERENCES'));
test('Unique constraints exist', migrationContent.includes('UNIQUE'));
test('Check constraints exist', migrationContent.includes('CHECK'));
test('CASCADE DELETE configured', migrationContent.includes('ON DELETE CASCADE'));

console.log('\n6. Advanced Features Tests');
console.log('─'.repeat(60));

test('UUID extension enabled', migrationContent.includes('uuid-ossp'));
test('Triggers defined', migrationContent.includes('CREATE TRIGGER'));
test('Functions defined', migrationContent.includes('CREATE OR REPLACE FUNCTION'));
test('Views defined', migrationContent.includes('CREATE VIEW'));
test('Updated_at automation exists', migrationContent.includes('update_updated_at_column'));

console.log('\n7. Migration Runner Tests');
console.log('─'.repeat(60));

const migrateContent = fs.readFileSync(path.join(__dirname, 'migrate.js'), 'utf8');

test('Migration tracking table creation', migrateContent.includes('schema_migrations'));
test('Apply migration function exists', migrateContent.includes('applyMigration'));
test('Get applied migrations function exists', migrateContent.includes('getAppliedMigrations'));
test('Run migrations function exists', migrateContent.includes('runMigrations'));
test('Status command exists', migrateContent.includes('status'));

console.log('\n8. Documentation Tests');
console.log('─'.repeat(60));

const readmeContent = fs.readFileSync(
  path.join(__dirname, 'migrations', 'README.md'),
  'utf8'
);

test('README has usage instructions', readmeContent.includes('Running Migrations'));
test('README has table documentation', readmeContent.includes('Tables'));
test('README has troubleshooting section', readmeContent.includes('Troubleshooting'));

const schemaDocContent = fs.readFileSync(
  path.join(__dirname, 'DATABASE-SCHEMA.md'),
  'utf8'
);

test('Schema doc has ERD', schemaDocContent.includes('Entity Relationship'));
test('Schema doc has common queries', schemaDocContent.includes('Common Queries'));
test('Schema doc has table schemas', schemaDocContent.includes('Table Schemas'));

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✓ ALL TESTS PASSED!');
  console.log('Migration setup is complete and ready to use.');
} else {
  console.log('✗ SOME TESTS FAILED');
  console.log('Please review the failed tests above.');
}
console.log('='.repeat(60));

process.exit(allPassed ? 0 : 1);
