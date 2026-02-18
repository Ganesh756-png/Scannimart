
async function verifyInsights() {
    console.log("Testing Insights Fallback...");
    try {
        const res = await fetch('http://localhost:3000/api/sales/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Insights Verification Failed:", e);
    }
}
verifyInsights();
