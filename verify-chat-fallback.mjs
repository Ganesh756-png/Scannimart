
async function verifyChat() {
    console.log("Testing Chat Fallback...");
    try {
        const res = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Hello", history: [] })
        });
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Chat Verification Failed:", e);
    }
}
verifyChat();
