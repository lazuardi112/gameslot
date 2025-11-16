document.addEventListener('DOMContentLoaded', () => {
  const apiSettingsForm = document.getElementById('api-settings-form');
  const userList = document.getElementById('user-list');

  // Fetch and display current API settings
  const fetchApiSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', { credentials: 'include' });
      const settings = await response.json();
      document.getElementById('flutter-sdk-path').value = settings.flutter_sdk_path || '';
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch and display user list
  const fetchUserList = async () => {
    try {
      const response = await fetch('/api/admin/users', { credentials: 'include' });
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
    const flutterSdkPath = document.getElementById('flutter-sdk-path').value;

    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flutter_sdk_path: flutterSdkPath }),
        credentials: 'include'
      });
      alert('Settings updated successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to update API settings');
    }
  });

  // Function to update user app limit
  window.updateUserLimit = async (userId, button) => {
    const newLimit = button.parentElement.previousElementSibling.querySelector('input').value;
    try {
      await fetch(`/api/admin/users/${userId}/limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: newLimit }),
        credentials: 'include'
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
