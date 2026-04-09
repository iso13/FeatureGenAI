
const { Pool } = require('pg');

async function fixSpacingInAllFeatures() {
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
    
    // Get all features with content
    console.log('📝 Fetching features...');
    const result = await pool.query(`
      SELECT id, title, generated_content 
      FROM features 
      WHERE generated_content IS NOT NULL AND generated_content != ''
    `);
    
    console.log(`Found ${result.rows.length} features with content to process`);
    
    let updatedCount = 0;
    
    for (const feature of result.rows) {
      if (feature.generated_content) {
        let originalContent = feature.generated_content;
        let cleanedContent = originalContent;

        // Apply comprehensive spacing fixes
        
        // 1. Remove excessive blank lines (3+ consecutive) but preserve single blank lines
        cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n+/g, '\n\n');
        
        // 2. Fix spacing around Feature title - remove extra blank lines after domain tags
        cleanedContent = cleanedContent.replace(/(^@[^\n]+)\n\s*\n+(Feature:)/gm, '$1\n$2');
        
        // 3. Ensure blank line after user story before Background/Scenario
        cleanedContent = cleanedContent.replace(/(Feature:.*\n(?:\s{2}.*\n)*?)(?=\s*(?:Background:|Scenario:))/g, '$1\n');
        
        // 4. Fix spacing before Background
        cleanedContent = cleanedContent.replace(/(\S.*)\n(Background:)/g, '$1\n\n$2');
        
        // 5. Fix spacing before Scenarios  
        cleanedContent = cleanedContent.replace(/(\S.*)\n(Scenario:)/g, '$1\n\n$2');
        
        // 6. Clean up multiple blank lines between scenarios
        cleanedContent = cleanedContent.replace(/(\nScenario:.*(?:\n\s+.*)*)\n\n\n+(Scenario:)/g, '$1\n\n$2');
        
        // 7. Fix any trailing spaces on lines
        cleanedContent = cleanedContent.replace(/[ \t]+$/gm, '');
        
        // 8. Ensure file ends with single newline
        cleanedContent = cleanedContent.replace(/\n*$/, '\n');

        // Only update if content actually changed
        if (cleanedContent !== originalContent) {
          console.log(`🔧 Fixing spacing in: ${feature.title}`);
          
          await pool.query(`
            UPDATE features 
            SET generated_content = $1, updated_at = NOW()
            WHERE id = $2
          `, [cleanedContent, feature.id]);
          
          updatedCount++;
        }
      }
    }
    
    console.log(`\n✅ Successfully fixed spacing in ${updatedCount} features`);
    
    if (updatedCount === 0) {
      console.log('ℹ️  No features needed spacing fixes');
    }
    
  } catch (error) {
    console.error('❌ Error fixing spacing:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    console.error('Stack trace:', error.stack);
  } finally {
    try {
      await pool.end();
      console.log('🔌 Database connection closed');
    } catch (closeError) {
      console.error('Error closing connection:', closeError.message);
    }
  }
}

// Run the function
console.log('🚀 Starting spacing fix script...');
fixSpacingInAllFeatures().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
