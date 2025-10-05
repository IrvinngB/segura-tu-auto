const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://sztuxibgvlwbykaopnqg.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dHV4aWJndmx3YnlrYW9wbnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjIwOTAsImV4cCI6MjA3MzY5ODA5MH0.FG8snw8YMe4HTW76uMuy_ghIJUho-Ltq96cDUNq0OgM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("Testing Supabase connection...");

    try {
        // Test basic connection
        console.log("1. Testing basic connection...");
        const { data: connectionTest, error: connectionError } = await supabase
            .from("users")
            .select("count")
            .limit(0);

        if (connectionError) {
            console.error("Connection error:", connectionError);
            return;
        }

        console.log("✅ Connection successful!");

        // Test if quotes table exists
        console.log("2. Testing quotes table...");
        const { data: quotesTest, error: quotesError } = await supabase
            .from("quotes")
            .select("count")
            .limit(0);

        if (quotesError) {
            console.error("❌ Quotes table error:", quotesError);
            console.log("This confirms the quotes table does not exist!");
        } else {
            console.log("✅ Quotes table exists!");
        }

        // List all tables
        console.log("3. Listing all tables...");
        const { data: tables, error: tablesError } = await supabase.rpc(
            "get_table_list"
        );

        if (tablesError) {
            console.log("Could not get table list:", tablesError.message);
        } else {
            console.log("Available tables:", tables);
        }
    } catch (error) {
        console.error("Unexpected error:", error);
    }
}

testConnection();
