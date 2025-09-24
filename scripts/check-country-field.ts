import { supabase } from "../lib/supabase/client";

async function checkAndMigrateCountryField() {
    console.log("🔍 Checking if country column exists...");

    try {
        // Try to select country column to see if it exists
        const { data, error } = await supabase
            .from("customers")
            .select("country")
            .limit(1);

        if (error) {
            console.log(
                "❌ Country column does not exist. Error:",
                error.message
            );

            if (error.message.includes('column "country" does not exist')) {
                console.log("🚀 Adding country column...");

                // Since we can't execute DDL directly, we'll show the SQL needed
                console.log("Please run this SQL in your Supabase SQL editor:");
                console.log(`
ALTER TABLE customers 
ADD COLUMN country VARCHAR(100) DEFAULT 'México';

CREATE INDEX idx_customers_country ON customers(country);

UPDATE customers 
SET country = 'México'
WHERE country IS NULL;
        `);
            }
        } else {
            console.log("✅ Country column already exists!");
            console.log("Data:", data);
        }
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// Run check
checkAndMigrateCountryField();
