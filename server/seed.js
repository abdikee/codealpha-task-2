import bcrypt from 'bcrypt';
import { query, transaction, testConnection } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database Seed Script
 * Creates initial test users, posts, and interactions for development and testing
 * 
 * Requirements: 1.1 (User Authentication), 3.1 (Posts)
 */

// Test user data
const TEST_USERS = [
  {
    email: 'alice@example.com',
    username: 'alice_wonder',
    password: 'password123',
    bio: 'Software engineer and coffee enthusiast ☕',
    avatar_url: '/images/avatars/alice.jpg'
  },
  {
    email: 'bob@example.com',
    username: 'bob_builder',
    password: 'password123',
    bio: 'Building amazing things one line at a time 🚀',
    avatar_url: '/images/avatars/bob.jpg'
  },
  {
    email: 'charlie@example.com',
    username: 'charlie_dev',
    password: 'password123',
    bio: 'Full-stack developer | Open source contributor',
    avatar_url: '/images/avatars/charlie.jpg'
  },
  {
    email: 'diana@example.com',
    username: 'diana_design',
    password: 'password123',
    bio: 'UI/UX Designer | Making the web beautiful 🎨',
    avatar_url: '/images/avatars/diana.jpg'
  },
  {
    email: 'eve@example.com',
    username: 'eve_explorer',
    password: 'password123',
    bio: 'Tech explorer | Always learning something new 📚',
    avatar_url: '/images/avatars/eve.jpg'
  }
];

// Sample post content
const SAMPLE_POSTS = [
  {
    content: 'Just deployed my first Express.js app! 🎉 #nodejs #express #webdev',
    image_url: '/images/posts/deployment.jpg'
  },
  {
    content: 'Learning PostgreSQL has been an amazing journey. The power of relational databases! #database #postgresql',
    image_url: null
  },
  {
    content: 'Coffee + Code = Perfect Morning ☕💻 #coding #developer',
    image_url: '/images/posts/coffee-code.jpg'
  },
  {
    content: 'Just finished a great book on system design. Highly recommend! #systemdesign #learning',
    image_url: null
  },
  {
    content: 'Working on a new feature for our social media platform. Excited to share soon! #development #socialmedia',
    image_url: '/images/posts/feature-preview.jpg'
  },
  {
    content: 'The best way to learn is by building. What are you working on today? #buildinpublic',
    image_url: null
  },
  {
    content: 'Just discovered this amazing JavaScript trick! Mind = blown 🤯 #javascript #webdev',
    image_url: null
  },
  {
    content: 'Beautiful sunset from my home office window 🌅 #workfromhome #nature',
    image_url: '/images/posts/sunset.jpg'
  },
  {
    content: 'Debugging is like being a detective in a crime movie where you are also the murderer 🕵️ #programming #humor',
    image_url: null
  },
  {
    content: 'New blog post: "Building Scalable APIs with Node.js" - link in bio! #nodejs #api #tutorial',
    image_url: '/images/posts/blog-post.jpg'
  },
  {
    content: 'Attending an amazing tech conference today! So many great talks 🎤 #techconference #networking',
    image_url: '/images/posts/conference.jpg'
  },
  {
    content: 'Just hit 1000 followers! Thank you all for the support 🙏 #milestone #grateful',
    image_url: null
  },
  {
    content: 'Working late tonight to finish this feature. The grind never stops! 💪 #hustle #developer',
    image_url: null
  },
  {
    content: 'My workspace setup for maximum productivity 🖥️⌨️ #workspace #productivity',
    image_url: '/images/posts/workspace.jpg'
  },
  {
    content: 'Just open-sourced my latest project! Check it out on GitHub #opensource #github',
    image_url: null
  }
];

// Sample comments
const SAMPLE_COMMENTS = [
  'Great work! Keep it up! 👏',
  'This is awesome! Can you share more details?',
  'I love this! Thanks for sharing 😊',
  'Very interesting perspective!',
  'This helped me a lot, thank you!',
  'Amazing! I need to try this',
  'Congratulations! Well deserved 🎉',
  'This is exactly what I was looking for!',
  'Great post! Very informative',
  'Thanks for the inspiration! 💡'
];

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Create test users
 * @param {Object} client - Database client
 * @returns {Promise<Array>} Array of created user IDs
 */
async function createUsers(client) {
  console.log('Creating test users...');
  const userIds = [];
  
  for (const user of TEST_USERS) {
    const hashedPassword = await hashPassword(user.password);
    
    const result = await client.query(
      `INSERT INTO users (email, username, password_hash, bio, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username`,
      [user.email, user.username, hashedPassword, user.bio, user.avatar_url]
    );
    
    userIds.push(result.rows[0].id);
    console.log(`  ✓ Created user: ${result.rows[0].username}`);
  }
  
  return userIds;
}

/**
 * Create sample posts
 * @param {Object} client - Database client
 * @param {Array} userIds - Array of user IDs
 * @returns {Promise<Array>} Array of created post IDs
 */
async function createPosts(client, userIds) {
  console.log('Creating sample posts...');
  const postIds = [];
  
  // Distribute posts among users
  for (let i = 0; i < SAMPLE_POSTS.length; i++) {
    const post = SAMPLE_POSTS[i];
    const userId = userIds[i % userIds.length]; // Rotate through users
    
    const result = await client.query(
      `INSERT INTO posts (user_id, content, image_url)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, post.content, post.image_url]
    );
    
    postIds.push(result.rows[0].id);
  }
  
  console.log(`  ✓ Created ${postIds.length} posts`);
  return postIds;
}

/**
 * Extract and create hashtags from posts
 * @param {Object} client - Database client
 * @param {Array} postIds - Array of post IDs
 * @returns {Promise<void>}
 */
async function createHashtags(client, postIds) {
  console.log('Creating hashtags...');
  let hashtagCount = 0;
  
  for (const postId of postIds) {
    // Get post content
    const postResult = await client.query(
      'SELECT content FROM posts WHERE id = $1',
      [postId]
    );
    
    const content = postResult.rows[0].content;
    
    // Extract hashtags using regex
    const hashtagMatches = content.match(/#[a-zA-Z0-9_]+/g);
    
    if (hashtagMatches) {
      for (const hashtagMatch of hashtagMatches) {
        const hashtagName = hashtagMatch.substring(1).toLowerCase(); // Remove # and convert to lowercase
        
        // Insert or get existing hashtag
        const hashtagResult = await client.query(
          `INSERT INTO hashtags (name)
           VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [hashtagName]
        );
        
        const hashtagId = hashtagResult.rows[0].id;
        
        // Create post-hashtag association
        await client.query(
          `INSERT INTO post_hashtags (post_id, hashtag_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [postId, hashtagId]
        );
        
        hashtagCount++;
      }
    }
  }
  
  console.log(`  ✓ Created hashtags and associations (${hashtagCount} total)`);
}

/**
 * Create follow relationships
 * @param {Object} client - Database client
 * @param {Array} userIds - Array of user IDs
 * @returns {Promise<void>}
 */
async function createFollows(client, userIds) {
  console.log('Creating follow relationships...');
  let followCount = 0;
  
  // Create a network where users follow each other
  for (let i = 0; i < userIds.length; i++) {
    for (let j = 0; j < userIds.length; j++) {
      if (i !== j && Math.random() > 0.4) { // 60% chance of following
        await client.query(
          `INSERT INTO follows (follower_id, following_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [userIds[i], userIds[j]]
        );
        followCount++;
      }
    }
  }
  
  console.log(`  ✓ Created ${followCount} follow relationships`);
}

/**
 * Create likes on posts
 * @param {Object} client - Database client
 * @param {Array} userIds - Array of user IDs
 * @param {Array} postIds - Array of post IDs
 * @returns {Promise<void>}
 */
async function createLikes(client, userIds, postIds) {
  console.log('Creating likes...');
  let likeCount = 0;
  
  // Each user likes random posts
  for (const userId of userIds) {
    for (const postId of postIds) {
      if (Math.random() > 0.6) { // 40% chance of liking a post
        await client.query(
          `INSERT INTO likes (post_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [postId, userId]
        );
        likeCount++;
      }
    }
  }
  
  console.log(`  ✓ Created ${likeCount} likes`);
}

/**
 * Create comments on posts
 * @param {Object} client - Database client
 * @param {Array} userIds - Array of user IDs
 * @param {Array} postIds - Array of post IDs
 * @returns {Promise<void>}
 */
async function createComments(client, userIds, postIds) {
  console.log('Creating comments...');
  let commentCount = 0;
  
  // Create comments on random posts
  for (const postId of postIds) {
    const numComments = Math.floor(Math.random() * 4); // 0-3 comments per post
    
    for (let i = 0; i < numComments; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const comment = SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];
      
      await client.query(
        `INSERT INTO comments (post_id, user_id, content)
         VALUES ($1, $2, $3)`,
        [postId, userId, comment]
      );
      commentCount++;
    }
  }
  
  console.log(`  ✓ Created ${commentCount} comments`);
}

/**
 * Create bookmarks
 * @param {Object} client - Database client
 * @param {Array} userIds - Array of user IDs
 * @param {Array} postIds - Array of post IDs
 * @returns {Promise<void>}
 */
async function createBookmarks(client, userIds, postIds) {
  console.log('Creating bookmarks...');
  let bookmarkCount = 0;
  
  // Each user bookmarks some random posts
  for (const userId of userIds) {
    for (const postId of postIds) {
      if (Math.random() > 0.8) { // 20% chance of bookmarking
        await client.query(
          `INSERT INTO bookmarks (user_id, post_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [userId, postId]
        );
        bookmarkCount++;
      }
    }
  }
  
  console.log(`  ✓ Created ${bookmarkCount} bookmarks`);
}

/**
 * Create sample messages between users
 * @param {Object} client - Database client
 * @param {Array} userIds - Array of user IDs
 * @returns {Promise<void>}
 */
async function createMessages(client, userIds) {
  console.log('Creating messages...');
  let messageCount = 0;
  
  const sampleMessages = [
    'Hey! How are you doing?',
    'Thanks for following me!',
    'I loved your recent post!',
    'Want to collaborate on a project?',
    'Great to connect with you!',
    'Your work is really inspiring!',
    'Let me know if you need any help',
    'Looking forward to seeing more of your content!'
  ];
  
  // Create conversations between random users
  for (let i = 0; i < userIds.length; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      if (Math.random() > 0.6) { // 40% chance of having a conversation
        const numMessages = Math.floor(Math.random() * 3) + 1; // 1-3 messages
        
        for (let k = 0; k < numMessages; k++) {
          const senderId = k % 2 === 0 ? userIds[i] : userIds[j];
          const receiverId = k % 2 === 0 ? userIds[j] : userIds[i];
          const message = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
          
          await client.query(
            `INSERT INTO messages (sender_id, receiver_id, content, read)
             VALUES ($1, $2, $3, $4)`,
            [senderId, receiverId, message, Math.random() > 0.5]
          );
          messageCount++;
        }
      }
    }
  }
  
  console.log(`  ✓ Created ${messageCount} messages`);
}

/**
 * Clear all existing data from tables
 * @param {Object} client - Database client
 * @returns {Promise<void>}
 */
async function clearData(client) {
  console.log('Clearing existing data...');
  
  // Delete in order to respect foreign key constraints
  await client.query('DELETE FROM activity_logs');
  await client.query('DELETE FROM bookmarks');
  await client.query('DELETE FROM post_hashtags');
  await client.query('DELETE FROM hashtags');
  await client.query('DELETE FROM notifications');
  await client.query('DELETE FROM messages');
  await client.query('DELETE FROM follows');
  await client.query('DELETE FROM likes');
  await client.query('DELETE FROM comments');
  await client.query('DELETE FROM posts');
  await client.query('DELETE FROM users');
  
  console.log('  ✓ All data cleared');
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting database seed...\n');
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Run all seed operations in a transaction
    await transaction(async (client) => {
      // Clear existing data
      await clearData(client);
      
      // Create test data
      const userIds = await createUsers(client);
      const postIds = await createPosts(client, userIds);
      await createHashtags(client, postIds);
      await createFollows(client, userIds);
      await createLikes(client, userIds, postIds);
      await createComments(client, userIds, postIds);
      await createBookmarks(client, userIds, postIds);
      await createMessages(client, userIds);
    });
    
    console.log('\n✅ Database seed completed successfully!');
    console.log('\nTest user credentials:');
    console.log('  Email: alice@example.com | Password: password123');
    console.log('  Email: bob@example.com | Password: password123');
    console.log('  Email: charlie@example.com | Password: password123');
    console.log('  Email: diana@example.com | Password: password123');
    console.log('  Email: eve@example.com | Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}

export { seed };
