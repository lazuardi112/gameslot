document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = event.target.username.value;
  const password = event.target.password.value;
  const errorMessage = document.getElementById('error-message');

  try {
    const response = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      window.location.href = 'admin_dashboard.html';
    } else {
      const data = await response.json();
      errorMessage.textContent = data.error;
    }
  } catch (error) {
    errorMessage.textContent = 'An error occurred. Please try again.';
    console.error(error);
  }
});
