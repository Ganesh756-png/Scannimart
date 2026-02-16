async function testVerify() {
    // The exact string from debug-qr.txt
    const qrString = 'ORDER-1771234435702-snj5j1';
    const payload = { qrCodeString: qrString };
    console.log('Testing Verify API with:', JSON.stringify(payload));

    try {
        const res = await fetch('http://localhost:3000/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const status = res.status;
        const text = await res.text();

        console.log(`\nStatus: ${status}`);
        console.log('Response Body:', text);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testVerify();
