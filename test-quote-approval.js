console.log("🧪 Testing quote approval after fix...");

// Simular aprobación de cotización
fetch('http://localhost:3006/api/quotes/1', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'sb-hfijzkyegiwmhbwkpuhw-auth-token=your_auth_token_here' // Este se obtendría del navegador
  },
  body: JSON.stringify({
    action: 'approve',
    notes: 'Cotización aprobada para prueba'
  })
})
.then(response => {
  console.log("📊 Response status:", response.status);
  return response.json();
})
.then(data => {
  console.log("📋 Response data:", data);
  if (data.error) {
    console.log("❌ Error:", data.error);
  } else {
    console.log("✅ Success:", data.message);
  }
})
.catch(error => {
  console.log("❌ Fetch error:", error.message);
});

console.log("🔄 Test sent, waiting for response...");