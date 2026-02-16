async function testVerify() {
    const payload = { qrCodeString: '81751C' };
    console.log('Testing Verify API with:', payload);

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
