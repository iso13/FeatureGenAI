
const { Pool } = require('pg');

async function removeDuplicatesDirectly() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    
    // Get all features with Submit Auto Insurance Claim in title
    console.log('🔍 Finding duplicate Submit Auto Insurance Claim features...');
    const result = await pool.query(`
      SELECT id, title, created_at, deleted 
      FROM features 
      WHERE LOWER(title) LIKE '%submit auto insurance claim%'
      ORDER BY created_at ASC
    `);
    
    console.log(`Found ${result.rows.length} features matching "Submit Auto Insurance Claim"`);
    
    if (result.rows.length <= 1) {
      console.log('ℹ️  No duplicates to remove');
      return;
    }
    
    // Show all found features
    result.rows.forEach((row, index) => {
      console.log(`${index === 0 ? '✅ KEEP' : '🗑️  DELETE'} - ID: ${row.id}, Title: "${row.title}", Created: ${row.created_at}, Deleted: ${row.deleted}`);
    });
    
    // Keep the first (oldest) one, mark others as deleted
    const keepFeature = result.rows[0];
    const duplicatesToRemove = result.rows.slice(1);
    
    console.log(`\n🎯 Keeping oldest feature: ID ${keepFeature.id}`);
    console.log(`🗑️  Marking ${duplicatesToRemove.length} duplicates as deleted...`);
    
    let deletedCount = 0;
    
    for (const duplicate of duplicatesToRemove) {
      if (!duplicate.deleted) {
        console.log(`   - Deleting ID ${duplicate.id}: "${duplicate.title}"`);
        await pool.query(`
          UPDATE features 
          SET deleted = true, updated_at = NOW()
          WHERE id = $1
        `, [duplicate.id]);
        deletedCount++;
        console.log(`   ✅ Successfully deleted ID ${duplicate.id}`);
      } else {
        console.log(`   ℹ️  ID ${duplicate.id} already deleted`);
      }
    }
    
    console.log(`\n🎉 Successfully removed ${deletedCount} duplicate features!`);
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const verifyResult = await pool.query(`
      SELECT id, title, created_at, deleted 
      FROM features 
      WHERE LOWER(title) LIKE '%submit auto insurance claim%' AND deleted = false
      ORDER BY created_at ASC
    `);
    
    console.log(`✅ Now showing ${verifyResult.rows.length} active "Submit Auto Insurance Claim" features:`);
    verifyResult.rows.forEach(row => {
      console.log(`   - ID: ${row.id}, Title: "${row.title}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    try {
      await pool.end();
      console.log('🔌 Database connection closed');
    } catch (closeError) {
      console.error('Error closing connection:', closeError.message);
    }
  }
}

console.log('🚀 Starting direct duplicate removal script...');
removeDuplicatesDirectly().then(() => {
  console.log('🏁 Script completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
