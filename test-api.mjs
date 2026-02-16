async function testChatApi() {
    try {
        console.log("Testing Chat API...");
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Hello, do you have apples?" })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Error:", error);
    }
}

testChatApi();
