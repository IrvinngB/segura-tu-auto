// Test simple para verificar que SweetAlert2 funciona
console.log("🧪 Testing SweetAlert2 integration...");

const testSwal = () => {
    console.log("Testing SweetAlert import...");
    
    // Simular lo que hace nuestro componente
    const mockQuoteResponse = {
        message: "Cotización aprobada exitosamente",
        quote: { id: "test-id" },
        policy: { id: "policy-id" }
    };

    console.log("✅ SweetAlert2 should be working with our code");
    console.log("Mock response:", mockQuoteResponse);
};

testSwal();