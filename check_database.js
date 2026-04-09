
import { Pool } from 'pg';

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    
    console.log('Checking database schema...');
    
    // Check if users table exists and its columns
    const usersTableQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    
    const usersResult = await client.query(usersTableQuery);
    console.log('\nUsers table columns:');
    console.log(usersResult.rows);
    
    // Check if companies table exists
    const companiesTableQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `;
    
    const companiesResult = await client.query(companiesTableQuery);
    console.log('\nCompanies table columns:');
    console.log(companiesResult.rows);
    
    // List all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('\nAll tables in database:');
    console.log(tablesResult.rows.map(row => row.table_name));
    
    client.release();
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
