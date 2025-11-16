document.addEventListener('DOMContentLoaded', () => {
  const apiSettingsForm = document.getElementById('api-settings-form');
  const userList = document.getElementById('user-list');

  // Fetch and display current API settings
  const fetchApiSettings = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/settings');
      const settings = await response.json();
      document.getElementById('api-key').value = settings.api_key || '';
      document.getElementById('device-id').value = settings.device_id || '';
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch and display user list
  const fetchUserList = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/users');
      const users = await response.json();
      userList.innerHTML = '';
      users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.id}</td>
          <td>${user.whatsapp_number}</td>
          <td><input type="number" value="${user.app_limit}" min="0"></td>
          <td><button onclick="updateUserLimit(${user.id}, this)">Update</button></td>
        `;
        userList.appendChild(row);
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Handle API settings form submission
  apiSettingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const apiKey = document.getElementById('api-key').value;
    const deviceId = document.getElementById('device-id').value;

    try {
      await fetch('http://localhost:3000/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, device_id: deviceId }),
      });
      alert('API settings updated successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to update API settings');
    }
  });

  // Function to update user app limit
  window.updateUserLimit = async (userId, button) => {
    const newLimit = button.parentElement.previousElementSibling.querySelector('input').value;
    try {
      await fetch(`http://localhost:3000/api/admin/users/${userId}/limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: newLimit }),
      });
      alert('User app limit updated successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to update user app limit');
    }
  };

  fetchApiSettings();
  fetchUserList();
});
