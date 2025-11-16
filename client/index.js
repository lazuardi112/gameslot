document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const whatsapp_number = event.target.whatsapp_number.value;
  const message = document.getElementById('message');

  try {
    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp_number }),
    });
    const data = await response.json();
    message.textContent = data.message || data.error;
  } catch (error) {
    message.textContent = 'An error occurred';
    console.error(error);
  }
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const whatsapp_number = event.target.whatsapp_number.value;
  const otp = event.target.otp.value;
  const message = document.getElementById('message');

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp_number, otp }),
    });

    if (response.ok) {
      // Store user info (e.g., in localStorage) and redirect
      localStorage.setItem('whatsapp_number', whatsapp_number);
      window.location.href = 'dashboard.html';
    } else {
      const data = await response.json();
      message.textContent = data.error;
    }
  } catch (error) {
    message.textContent = 'An error occurred';
    console.error(error);
  }
});
