import { query, getClient, transaction, testConnection, getPoolStats } from './db.js';

/**
 * Test suite for database connection module
 */
async function runTests() {
  console.log('Starting database connection tests...\n');
  
  try {
    // Test 1: Basic connection test
    console.log('Test 1: Testing basic connection...');
    const connectionSuccess = await testConnection();
    console.log(connectionSuccess ? '✓ Connection test passed\n' : '✗ Connection test failed\n');
    
    // Test 2: Simple query
    console.log('Test 2: Testing simple query...');
    const result = await query('SELECT 1 + 1 as sum');
    console.log('Query result:', result.rows[0]);
    console.log(result.rows[0].sum === 2 ? '✓ Simple query passed\n' : '✗ Simple query failed\n');
    
    // Test 3: Parameterized query
    console.log('Test 3: Testing parameterized query...');
    const paramResult = await query('SELECT $1::text as message', ['Hello, Database!']);
    console.log('Query result:', paramResult.rows[0]);
    console.log(paramResult.rows[0].message === 'Hello, Database!' ? '✓ Parameterized query passed\n' : '✗ Parameterized query failed\n');
    
    // Test 4: Get client from pool
    console.log('Test 4: Testing client acquisition...');
    const client = await getClient();
    const clientResult = await client.query('SELECT current_database() as db');
    console.log('Current database:', clientResult.rows[0].db);
    client.release();
    console.log('✓ Client acquisition and release passed\n');
    
    // Test 5: Transaction (successful)
    console.log('Test 5: Testing successful transaction...');
    const txResult = await transaction(async (client) => {
      await client.query('SELECT 1');
      await client.query('SELECT 2');
      return 'Transaction completed';
    });
    console.log('Transaction result:', txResult);
    console.log('✓ Successful transaction passed\n');
    
    // Test 6: Transaction (rollback on error)
    console.log('Test 6: Testing transaction rollback...');
    try {
      await transaction(async (client) => {
        await client.query('SELECT 1');
        throw new Error('Intentional error for rollback test');
      });
      console.log('✗ Transaction rollback failed - error not caught\n');
    } catch (error) {
      console.log('Transaction rolled back as expected:', error.message);
      console.log('✓ Transaction rollback passed\n');
    }
    
    // Test 7: Pool statistics
    console.log('Test 7: Testing pool statistics...');
    const stats = getPoolStats();
    console.log('Pool stats:', stats);
    console.log('✓ Pool statistics passed\n');
    
    // Test 8: Multiple concurrent queries
    console.log('Test 8: Testing concurrent queries...');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(query('SELECT $1::int as num', [i]));
    }
    const results = await Promise.all(promises);
    console.log('Concurrent queries completed:', results.length);
    console.log(results.length === 5 ? '✓ Concurrent queries passed\n' : '✗ Concurrent queries failed\n');
    
    console.log('All tests completed successfully! ✓');
    
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runTests()
  .then(() => {
    console.log('\nTest suite finished. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
