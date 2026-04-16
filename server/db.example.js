/**
 * Database Module Usage Examples
 * 
 * This file demonstrates how to use the database connection module
 * in your application code.
 */

import { query, getClient, transaction } from './db.js';

// ============================================
// Example 1: Simple Query
// ============================================

export async function getUserById(userId) {
  try {
    const result = await query(
      'SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// ============================================
// Example 2: Insert with RETURNING
// ============================================

export async function createPost(userId, content, imageUrl = null) {
  try {
    const result = await query(
      `INSERT INTO posts (user_id, content, image_url, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [userId, content, imageUrl]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

// ============================================
// Example 3: Update Query
// ============================================

export async function updateUserBio(userId, bio) {
  try {
    const result = await query(
      'UPDATE users SET bio = $1 WHERE id = $2 RETURNING *',
      [bio, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating user bio:', error);
    throw error;
  }
}

// ============================================
// Example 4: Delete Query
// ============================================

export async function deletePost(postId, userId) {
  try {
    const result = await query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id',
      [postId, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Post not found or unauthorized');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// ============================================
// Example 5: Complex Query with JOIN
// ============================================

export async function getPostsWithAuthor(limit = 10, offset = 0) {
  try {
    const result = await query(
      `SELECT 
        p.id, p.content, p.image_url, p.created_at,
        u.id as author_id, u.username, u.avatar_url
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

// ============================================
// Example 6: Transaction - Multiple Related Operations
// ============================================

export async function createPostWithHashtags(userId, content, hashtags) {
  try {
    const result = await transaction(async (client) => {
      // 1. Create the post
      const postResult = await client.query(
        `INSERT INTO posts (user_id, content, created_at)
         VALUES ($1, $2, NOW())
         RETURNING *`,
        [userId, content]
      );
      
      const post = postResult.rows[0];
      
      // 2. Create or get hashtags and link them to the post
      for (const tag of hashtags) {
        // Get or create hashtag
        const hashtagResult = await client.query(
          `INSERT INTO hashtags (name, created_at)
           VALUES ($1, NOW())
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [tag.toLowerCase()]
        );
        
        const hashtagId = hashtagResult.rows[0].id;
        
        // Link hashtag to post
        await client.query(
          'INSERT INTO post_hashtags (post_id, hashtag_id) VALUES ($1, $2)',
          [post.id, hashtagId]
        );
      }
      
      // 3. Log activity
      await client.query(
        `INSERT INTO activity_logs (user_id, action_type, related_id, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, 'created_post', post.id]
      );
      
      return post;
    });
    
    return result;
  } catch (error) {
    console.error('Error creating post with hashtags:', error);
    throw error;
  }
}

// ============================================
// Example 7: Transaction - Transfer Operation
// ============================================

export async function followUser(followerId, followingId) {
  try {
    const result = await transaction(async (client) => {
      // 1. Check if already following
      const existingFollow = await client.query(
        'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
      );
      
      if (existingFollow.rows.length > 0) {
        throw new Error('Already following this user');
      }
      
      // 2. Create follow relationship
      const followResult = await client.query(
        `INSERT INTO follows (follower_id, following_id, created_at)
         VALUES ($1, $2, NOW())
         RETURNING *`,
        [followerId, followingId]
      );
      
      // 3. Create notification
      await client.query(
        `INSERT INTO notifications (user_id, type, related_id, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [followingId, 'follow', followerId]
      );
      
      // 4. Log activity
      await client.query(
        `INSERT INTO activity_logs (user_id, action_type, related_id, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [followerId, 'followed', followingId]
      );
      
      return followResult.rows[0];
    });
    
    return result;
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
}

// ============================================
// Example 8: Manual Client Management
// ============================================

export async function complexOperationWithManualClient() {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Your complex operations here
    const result1 = await client.query('SELECT * FROM users LIMIT 1');
    const result2 = await client.query('SELECT * FROM posts LIMIT 1');
    
    await client.query('COMMIT');
    
    return {
      users: result1.rows,
      posts: result2.rows
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in complex operation:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ============================================
// Example 9: Pagination Helper
// ============================================

export async function getPaginatedPosts(page = 1, pageSize = 10) {
  try {
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const countResult = await query('SELECT COUNT(*) FROM posts');
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    const postsResult = await query(
      `SELECT p.*, u.username, u.avatar_url
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );
    
    return {
      posts: postsResult.rows,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNext: offset + pageSize < totalCount,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching paginated posts:', error);
    throw error;
  }
}

// ============================================
// Example 10: Search with Pattern Matching
// ============================================

export async function searchUsers(searchTerm, limit = 10) {
  try {
    const pattern = `%${searchTerm}%`;
    
    const result = await query(
      `SELECT id, username, bio, avatar_url
       FROM users
       WHERE username ILIKE $1 OR bio ILIKE $1
       ORDER BY username
       LIMIT $2`,
      [pattern, limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

// ============================================
// Usage in Express Routes
// ============================================

/*
// In your Express route handlers:

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    const userId = req.user.id; // From auth middleware
    
    const post = await createPost(userId, content, imageUrl);
    
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const followerId = req.user.id; // From auth middleware
    const followingId = req.params.id;
    
    const follow = await followUser(followerId, followingId);
    
    res.status(201).json(follow);
  } catch (error) {
    if (error.message === 'Already following this user') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to follow user' });
  }
});
*/
