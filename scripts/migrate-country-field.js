const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://sztuxibgvlwbykaopnqg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dHV4aWJndmx3YnlrYW9wbnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEyMjA5MCwiZXhwIjoyMDczNjk4MDkwfQ.ptW2xg0PvIr3MwaHIGdv1IQn7-Yickcg_vy4RoCUpB0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateDatabaseSchema() {
    console.log('🚀 Starting database migration...');
    
    try {
        // Add country column to customers table
        console.log('📝 Adding country column to customers table...');
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `
                -- Add simple location field to customers table
                ALTER TABLE customers 
                ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Panamá';
                
                -- Create index for location-based queries
                CREATE INDEX IF NOT EXISTS idx_customers_country ON customers(country);
                
                -- Update existing customers with default country
                UPDATE customers 
                SET country = 'Panamá'
                WHERE country IS NULL;
            `
        });

        if (alterError) {
            console.error('❌ Error executing SQL:', alterError);
            return;
        }

        console.log('✅ Database migration completed successfully!');
        console.log('📊 Summary:');
        console.log('   - Added country column to customers table');
        console.log('   - Created index on country column');
        console.log('   - Set default country to México for existing customers');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Run migration
migrateDatabaseSchema();