const axios = require('axios');

async function testPrincipalAccess() {
    try {
        // 1. Login as Principal
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'principal',
            password: 'admin123' // The seed function uses 'admin123'
        });
        
        const token = loginRes.data.token;
        console.log("Logged in as Principal. Token obtained.");

        // 2. Fetch Leaves
        const leavesRes = await axios.get('http://localhost:5000/api/leaves', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Leaves fetched by Principal:", leavesRes.data.length);
        console.log("First 2 leaves:", JSON.stringify(leavesRes.data.slice(0, 2), null, 2));

        // 3. Fetch Directory
        const dirRes = await axios.get('http://localhost:5000/api/auth/directory', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Directory fetched by Principal:", dirRes.data.length);

    } catch (error) {
        console.error("Test failed:", error.response ? error.response.data : error.message);
    }
}

testPrincipalAccess();
