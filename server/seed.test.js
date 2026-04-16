import { query, testConnection, closePool } from './db.js';
import { seed } from './seed.js';

/**
 * Test suite for database seed script
 * Validates that seed data is created correctly
 */

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  console.log('Testing database connection...');
  const connected = await testConnection();
  
  if (!connected) {
    throw new Error('Database connection failed');
  }
  
  console.log('  ✓ Database connection successful');
}

/**
 * Verify users were created
 */
async function verifyUsers() {
  console.log('Verifying users...');
  
  const result = await query('SELECT COUNT(*) as count FROM users');
  const count = parseInt(result.rows[0].count);
  
  if (count < 5) {
    throw new Error(`Expected at least 5 users, found ${count}`);
  }
  
  // Verify user structure
  const userResult = await query('SELECT * FROM users LIMIT 1');
  const user = userResult.rows[0];
  
  if (!user.id || !user.email || !user.username || !user.password_hash) {
    throw new Error('User record missing required fields');
  }
  
  console.log(`  ✓ Found ${count} users with correct structure`);
}

/**
 * Verify posts were created
 */
async function verifyPosts() {
  console.log('Verifying posts...');
  
  const result = await query('SELECT COUNT(*) as count FROM posts');
  const count = parseInt(result.rows[0].count);
  
  if (count < 10) {
    throw new Error(`Expected at least 10 posts, found ${count}`);
  }
  
  // Verify post structure
  const postResult = await query('SELECT * FROM posts LIMIT 1');
  const post = postResult.rows[0];
  
  if (!post.id || !post.user_id || !post.content) {
    throw new Error('Post record missing required fields');
  }
  
  console.log(`  ✓ Found ${count} posts with correct structure`);
}

/**
 * Verify hashtags were created
 */
async function verifyHashtags() {
  console.log('Verifying hashtags...');
  
  const result = await query('SELECT COUNT(*) as count FROM hashtags');
  const count = parseInt(result.rows[0].count);
  
  if (count < 1) {
    throw new Error('Expected at least 1 hashtag');
  }
  
  // Verify post_hashtags associations
  const assocResult = await query('SELECT COUNT(*) as count FROM post_hashtags');
  const assocCount = parseInt(assocResult.rows[0].count);
  
  if (assocCount < 1) {
    throw new Error('Expected at least 1 post-hashtag association');
  }
  
  console.log(`  ✓ Found ${count} hashtags with ${assocCount} associations`);
}

/**
 * Verify follows were created
 */
async function verifyFollows() {
  console.log('Verifying follows...');
  
  const result = await query('SELECT COUNT(*) as count FROM follows');
  const count = parseInt(result.rows[0].count);
  
  if (count < 1) {
    throw new Error('Expected at least 1 follow relationship');
  }
  
  // Verify no self-follows
  const selfFollowResult = await query(
    'SELECT COUNT(*) as count FROM follows WHERE follower_id = following_id'
  );
  const selfFollowCount = parseInt(selfFollowResult.rows[0].count);
  
  if (selfFollowCount > 0) {
    throw new Error(`Found ${selfFollowCount} self-follow relationships (should be 0)`);
  }
  
  console.log(`  ✓ Found ${count} follow relationships (no self-follows)`);
}

/**
 * Verify likes were created
 */
async function verifyLikes() {
  console.log('Verifying likes...');
  
  const result = await query('SELECT COUNT(*) as count FROM likes');
  const count = parseInt(result.rows[0].count);
  
  if (count < 1) {
    throw new Error('Expected at least 1 like');
  }
  
  // Verify unique constraint (no duplicate likes)
  const duplicateResult = await query(`
    SELECT post_id, user_id, COUNT(*) as count
    FROM likes
    GROUP BY post_id, user_id
    HAVING COUNT(*) > 1
  `);
  
  if (duplicateResult.rows.length > 0) {
    throw new Error('Found duplicate likes (violates unique constraint)');
  }
  
  console.log(`  ✓ Found ${count} likes (all unique)`);
}

/**
 * Verify comments were created
 */
async function verifyComments() {
  console.log('Verifying comments...');
  
  const result = await query('SELECT COUNT(*) as count FROM comments');
  const count = parseInt(result.rows[0].count);
  
  if (count < 1) {
    throw new Error('Expected at least 1 comment');
  }
  
  // Verify comment structure
  const commentResult = await query('SELECT * FROM comments LIMIT 1');
  const comment = commentResult.rows[0];
  
  if (!comment.id || !comment.post_id || !comment.user_id || !comment.content) {
    throw new Error('Comment record missing required fields');
  }
  
  console.log(`  ✓ Found ${count} comments with correct structure`);
}

/**
 * Verify bookmarks were created
 */
async function verifyBookmarks() {
  console.log('Verifying bookmarks...');
  
  const result = await query('SELECT COUNT(*) as count FROM bookmarks');
  const count = parseInt(result.rows[0].count);
  
  // Bookmarks are optional, so just verify structure if any exist
  if (count > 0) {
    const bookmarkResult = await query('SELECT * FROM bookmarks LIMIT 1');
    const bookmark = bookmarkResult.rows[0];
    
    if (!bookmark.id || !bookmark.user_id || !bookmark.post_id) {
      throw new Error('Bookmark record missing required fields');
    }
  }
  
  console.log(`  ✓ Found ${count} bookmarks`);
}

/**
 * Verify messages were created
 */
async function verifyMessages() {
  console.log('Verifying messages...');
  
  const result = await query('SELECT COUNT(*) as count FROM messages');
  const count = parseInt(result.rows[0].count);
  
  // Messages are optional, so just verify structure if any exist
  if (count > 0) {
    const messageResult = await query('SELECT * FROM messages LIMIT 1');
    const message = messageResult.rows[0];
    
    if (!message.id || !message.sender_id || !message.receiver_id || !message.content) {
      throw new Error('Message record missing required fields');
    }
    
    // Verify no self-messages
    const selfMessageResult = await query(
      'SELECT COUNT(*) as count FROM messages WHERE sender_id = receiver_id'
    );
    const selfMessageCount = parseInt(selfMessageResult.rows[0].count);
    
    if (selfMessageCount > 0) {
      throw new Error(`Found ${selfMessageCount} self-messages (should be 0)`);
    }
  }
  
  console.log(`  ✓ Found ${count} messages (no self-messages)`);
}

/**
 * Verify data relationships
 */
async function verifyRelationships() {
  console.log('Verifying data relationships...');
  
  // Verify all posts have valid user_id
  const orphanPostsResult = await query(`
    SELECT COUNT(*) as count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE u.id IS NULL
  `);
  
  if (parseInt(orphanPostsResult.rows[0].count) > 0) {
    throw new Error('Found posts with invalid user_id');
  }
  
  // Verify all comments have valid post_id and user_id
  const orphanCommentsResult = await query(`
    SELECT COUNT(*) as count
    FROM comments c
    LEFT JOIN posts p ON c.post_id = p.id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE p.id IS NULL OR u.id IS NULL
  `);
  
  if (parseInt(orphanCommentsResult.rows[0].count) > 0) {
    throw new Error('Found comments with invalid post_id or user_id');
  }
  
  // Verify all likes have valid post_id and user_id
  const orphanLikesResult = await query(`
    SELECT COUNT(*) as count
    FROM likes l
    LEFT JOIN posts p ON l.post_id = p.id
    LEFT JOIN users u ON l.user_id = u.id
    WHERE p.id IS NULL OR u.id IS NULL
  `);
  
  if (parseInt(orphanLikesResult.rows[0].count) > 0) {
    throw new Error('Found likes with invalid post_id or user_id');
  }
  
  console.log('  ✓ All relationships are valid');
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Running seed script tests...\n');
  
  try {
    // Test database connection
    await testDatabaseConnection();
    
    // Verify all seeded data
    await verifyUsers();
    await verifyPosts();
    await verifyHashtags();
    await verifyFollows();
    await verifyLikes();
    await verifyComments();
    await verifyBookmarks();
    await verifyMessages();
    await verifyRelationships();
    
    console.log('\n✅ All seed tests passed!');
    
    // Close database connection
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await closePool();
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
