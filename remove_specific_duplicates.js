
const axios = require('axios');

async function removeSpecificDuplicates() {
  try {
    console.log('🔍 Fetching all features...');
    const response = await axios.get('http://localhost:5000/api/features');
    const features = response.data;
    
    console.log(`📊 Total features found: ${features.length}`);
    
    // Find all features with "Submit Auto Insurance Claim" in title (case insensitive)
    const claimFeatures = features.filter(f => 
      f.title.toLowerCase().includes('submit auto insurance claim') && !f.deleted
    );
    
    console.log(`🎯 Found ${claimFeatures.length} active claim features:`);
    claimFeatures.forEach(f => {
      console.log(`   - ID: ${f.id}, Title: "${f.title}", Created: ${f.createdAt}`);
    });
    
    if (claimFeatures.length > 1) {
      // Sort by creation date to keep the oldest
      claimFeatures.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      const keepFeature = claimFeatures[0];
      const duplicatesToRemove = claimFeatures.slice(1);
      
      console.log(`\n✅ Keeping oldest feature: ID ${keepFeature.id} - "${keepFeature.title}"`);
      console.log(`🗑️  Marking ${duplicatesToRemove.length} duplicates as deleted:`);
      
      for (const duplicate of duplicatesToRemove) {
        console.log(`   - Deleting ID ${duplicate.id}: "${duplicate.title}"`);
        try {
          await axios.patch(`http://localhost:5000/api/features/${duplicate.id}`, {
            deleted: true
          });
          console.log(`   ✅ Successfully deleted ID ${duplicate.id}`);
        } catch (error) {
          console.error(`   ❌ Failed to delete ID ${duplicate.id}: ${error.message}`);
        }
      }
      
      console.log('\n🎉 Duplicate removal complete!');
    } else if (claimFeatures.length === 1) {
      console.log('ℹ️  Only one active claim feature found - no duplicates to remove');
    } else {
      console.log('ℹ️  No active claim features found');
    }
    
    // Also check for any other duplicate titles
    console.log('\n🔍 Checking for other duplicates...');
    const titleGroups = {};
    features.filter(f => !f.deleted).forEach(f => {
      const normalizedTitle = f.title.toLowerCase().trim();
      if (!titleGroups[normalizedTitle]) {
        titleGroups[normalizedTitle] = [];
      }
      titleGroups[normalizedTitle].push(f);
    });
    
    const otherDuplicates = Object.entries(titleGroups).filter(([title, group]) => group.length > 1);
    
    if (otherDuplicates.length > 0) {
      console.log(`⚠️  Found ${otherDuplicates.length} other duplicate title groups:`);
      otherDuplicates.forEach(([title, group]) => {
        console.log(`   - "${title}": ${group.length} features`);
      });
    } else {
      console.log('✅ No other duplicates found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

console.log('🚀 Starting duplicate removal script...');
removeSpecificDuplicates().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
