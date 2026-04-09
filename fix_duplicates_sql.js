
const { Pool } = require('pg');

async function fixDuplicatesWithSQL() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully');

    // First, let's see what duplicates exist
    console.log('🔍 Finding duplicate features...');
    const duplicatesQuery = `
      SELECT title, COUNT(*) as count, array_agg(id ORDER BY created_at) as ids
      FROM features 
      WHERE deleted = false
      GROUP BY LOWER(title) 
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `;
    
    const duplicates = await pool.query(duplicatesQuery);
    console.log(`Found ${duplicates.rows.length} sets of duplicates:`);
    
    duplicates.rows.forEach(row => {
      console.log(`  "${row.title}": ${row.count} copies (IDs: ${row.ids.join(', ')})`);
    });

    if (duplicates.rows.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    // For each group of duplicates, keep the first (oldest) and delete the rest
    let totalDeleted = 0;
    
    for (const group of duplicates.rows) {
      const [keepId, ...deleteIds] = group.ids;
      console.log(`\n📝 For "${group.title}":`);
      console.log(`  ✅ Keeping ID ${keepId}`);
      console.log(`  🗑️  Deleting IDs: ${deleteIds.join(', ')}`);
      
      if (deleteIds.length > 0) {
        const deleteQuery = `
          UPDATE features 
          SET deleted = true, updated_at = NOW() 
          WHERE id = ANY($1)
        `;
        
        const result = await pool.query(deleteQuery, [deleteIds]);
        console.log(`  ✅ Marked ${result.rowCount} features as deleted`);
        totalDeleted += result.rowCount;
      }
    }

    console.log(`\n🎉 Successfully removed ${totalDeleted} duplicate features!`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const verifyResult = await pool.query(`
      SELECT title, COUNT(*) as count
      FROM features 
      WHERE deleted = false
      GROUP BY LOWER(title) 
      HAVING COUNT(*) > 1
    `);
    
    if (verifyResult.rows.length === 0) {
      console.log('✅ All duplicates have been removed!');
    } else {
      console.log('⚠️  Still have duplicates:', verifyResult.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

console.log('🚀 Starting SQL duplicate fix...');
fixDuplicatesWithSQL().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
