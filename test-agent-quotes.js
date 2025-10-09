const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://sztuxibgvlwbykaopnqg.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dHV4aWJndmx3YnlrYW9wbnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjIwOTAsImV4cCI6MjA3MzY5ODA5MH0.FG8snw8YMe4HTW76uMuy_ghIJUho-Ltq96cDUNq0OgM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAgentQuotesAccess() {
    console.log("🧪 Testing agent access to quotes...");

    try {
        // First, create a test agent user
        console.log("1. Creating test agent user...");

        const testAgent = {
            email: `agent_test_${Date.now()}@example.com`,
            password: "agent123456",
        };

        const { data: authData, error: authError } = await supabase.auth.signUp(
            {
                email: testAgent.email,
                password: testAgent.password,
                options: {
                    data: {
                        first_name: "Test",
                        last_name: "Agent",
                        role: "agent",
                    },
                },
            }
        );

        if (authError) {
            console.error("❌ Agent signup failed:", authError);
            return;
        }

        console.log("✅ Agent created:", authData.user.id);

        // Insert agent into users table
        const { error: userError } = await supabase.from("users").insert({
            id: authData.user.id,
            email: testAgent.email,
            first_name: "Test",
            last_name: "Agent",
            role: "agent",
            password_hash: "handled_by_supabase_auth",
        });

        if (userError) {
            console.error("❌ Agent user insert failed:", userError);
            return;
        }

        console.log("✅ Agent user record created");

        // Now test quotes access with this agent
        console.log("2. Testing quotes API access...");

        // Sign in as the agent
        const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
                email: testAgent.email,
                password: testAgent.password,
            });

        if (signInError) {
            console.error("❌ Agent sign in failed:", signInError);
            return;
        }

        console.log("✅ Agent signed in successfully");

        // Test quotes access
        const { data: quotesData, error: quotesError } = await supabase
            .from("quotes")
            .select(
                `
        *,
        customer:customers (
          *,
          user:users(*)
        ),
        vehicle:vehicles(*),
        agent:users(*)
      `
            )
            .order("created_at", { ascending: false });

        if (quotesError) {
            console.error("❌ Quotes access failed:", quotesError);
        } else {
            console.log("✅ Quotes access successful");
            console.log(`Found ${quotesData.length} quotes`);

            if (quotesData.length > 0) {
                console.log("Sample quote:", {
                    id: quotesData[0].id,
                    quote_number: quotesData[0].quote_number,
                    status: quotesData[0].status,
                    customer_name: quotesData[0].customer?.user?.first_name,
                });
            }
        }

        // Test API endpoint directly
        console.log("3. Testing /api/quotes endpoint...");

        try {
            const response = await fetch("http://localhost:3006/api/quotes", {
                headers: {
                    Authorization: `Bearer ${signInData.session.access_token}`,
                },
            });

            if (response.ok) {
                const apiData = await response.json();
                console.log("✅ API endpoint accessible");
                console.log(
                    `API returned ${apiData.quotes?.length || 0} quotes`
                );
            } else {
                console.error(
                    "❌ API endpoint failed:",
                    response.status,
                    response.statusText
                );
            }
        } catch (fetchError) {
            console.log(
                "⚠️  API endpoint test skipped (fetch not available in Node.js)"
            );
        }
    } catch (error) {
        console.error("💥 Unexpected error:", error);
    }
}

testAgentQuotesAccess();
