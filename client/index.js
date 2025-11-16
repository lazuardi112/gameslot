document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const whatsapp_number = event.target.whatsapp_number.value;
  const message = document.getElementById('message');

  try {
    const response = await fetch('/register', {
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
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp_number, otp }),
    });

    if (response.ok) {
      window.location.href = '/';
    } else {
      const data = await response.json();
      message.textContent = data.error;
    }
  } catch (error) {
    message.textContent = 'An error occurred';
    console.error(error);
  }
});
