
import pkg from 'pg';
const { Pool } = pkg;

async function emergencyDuplicateFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🚨 EMERGENCY: Fixing duplicates NOW...');
    
    // Direct SQL to mark duplicates as deleted, keeping only the oldest
    const result = await pool.query(`
      UPDATE features 
      SET deleted = true, updated_at = NOW()
      WHERE id IN (
        SELECT id FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (PARTITION BY LOWER(title) ORDER BY created_at ASC) as rn
          FROM features 
          WHERE deleted = false
        ) ranked_features 
        WHERE rn > 1
      )
      RETURNING id, title;
    `);
    
    console.log(`✅ FIXED: Marked ${result.rows.length} duplicates as deleted`);
    
    if (result.rows.length > 0) {
      console.log('Deleted features:');
      result.rows.forEach(row => {
        console.log(`  - ID ${row.id}: "${row.title}"`);
      });
    }
    
    // Verify fix
    const verifyResult = await pool.query(`
      SELECT title, COUNT(*) as count
      FROM features 
      WHERE deleted = false
      GROUP BY LOWER(title)
      HAVING COUNT(*) > 1
    `);
    
    if (verifyResult.rows.length === 0) {
      console.log('🎉 SUCCESS: No more duplicates!');
    } else {
      console.log('⚠️  Still have duplicates:', verifyResult.rows);
    }
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  } finally {
    await pool.end();
  }
}

console.log('🚨 RUNNING EMERGENCY DUPLICATE FIX...');
emergencyDuplicateFix().then(() => {
  console.log('✅ EMERGENCY FIX COMPLETED');
  process.exit(0);
}).catch(error => {
  console.error('💥 EMERGENCY FIX FAILED:', error);
  process.exit(1);
});
