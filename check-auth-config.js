const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://sztuxibgvlwbykaopnqg.supabase.co";
const supabaseServiceKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dHV4aWJndmx3YnlrYW9wbnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEyMjA5MCwiZXhwIjoyMDczNjk4MDkwfQ.ptW2xg0PvIr3MwaHIGdv1IQn7-Yickcg_vy4RoCUpB0";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthSettings() {
    console.log("🔧 Checking Supabase auth configuration...");

    try {
        // Test creating a user with admin privileges to bypass email confirmation
        const testEmail = `admin_test_${Date.now()}@example.com`;

        console.log(
            "1. Testing admin user creation (bypass email confirmation)..."
        );

        const { data, error } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: "test123456",
            email_confirm: true, // This bypasses email confirmation
            user_metadata: {
                first_name: "Admin",
                last_name: "Test",
                phone: "+52 55 1234 5678",
                role: "customer",
            },
        });

        if (error) {
            console.error("❌ Admin user creation failed:", error);
            console.log("\n📋 Common causes:");
            console.log(
                "- Email confirmation is required in Supabase settings"
            );
            console.log("- Service role key may be incorrect");
            console.log("- RLS policies may be blocking the operation");
        } else {
            console.log("✅ Admin user creation successful:", data.user.id);
            console.log(
                "✅ Email confirmed:",
                data.user.email_confirmed_at !== null
            );

            // Now try to insert into users table
            console.log(
                "\n2. Testing users table insert with admin-created user..."
            );

            const { data: userData, error: userError } = await supabase
                .from("users")
                .insert({
                    id: data.user.id,
                    email: testEmail,
                    first_name: "Admin",
                    last_name: "Test",
                    phone: "+52 55 1234 5678",
                    role: "customer",
                    password_hash: "handled_by_supabase_auth",
                })
                .select();

            if (userError) {
                console.error("❌ Users table insert failed:", userError);
            } else {
                console.log("✅ Users table insert successful");
            }
        }
    } catch (error) {
        console.error("💥 Unexpected error:", error);
    }
}

checkAuthSettings();
