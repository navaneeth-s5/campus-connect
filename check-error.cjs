const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:81/login', { waitUntil: 'networkidle0' });
  
  // Click "Continue as Guest"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const guestBtn = buttons.find(b => b.textContent.includes('Continue as Guest'));
    if (guestBtn) guestBtn.click();
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test AI endpoint from within the page context
  await page.evaluate(async () => {
    try {
      let history = [];
      
      const askAI = async (text) => {
          console.log('USER:', text);
          const res = await fetch('/api/ai/command', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ query: text, history })
          });
          const data = await res.json();
          console.log('AI:', data.message, data.tool_call, data.payload);
          history.push({ role: 'user', content: text });
          history.push({ role: 'model', content: JSON.stringify(data) });
      };

      await askAI("I want to make an admission enquiry");
      await new Promise(r => setTimeout(r, 1000));
      await askAI("For May 10th from 10 AM to 11 AM.");
      await new Promise(r => setTimeout(r, 1000));
      await askAI("My name is John, purpose is BTech admission.");
      
    } catch (e) {
      console.log('AI FETCH ERROR:', e.message);
    }
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
  await browser.close();
})();
