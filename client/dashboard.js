document.addEventListener('DOMContentLoaded', () => {
  const whatsappNumber = localStorage.getItem('whatsapp_number');
  if (!whatsappNumber) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('whatsapp-number').textContent = whatsappNumber;
  const appList = document.getElementById('app-list');

  const fetchUserData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/user/${whatsappNumber}`);
      const userData = await response.json();
      document.getElementById('app-limit').textContent = userData.app_limit;

      appList.innerHTML = '';
      userData.apps.forEach(app => {
        const row = document.createElement('tr');
        let downloadLink = '';
        if (app.status === 'completed') {
            downloadLink = `<a href="http://localhost:3000/download/${app.id}/apk">APK</a> | <a href="http://localhost:3000/download/${app.id}/aab">AAB</a>`;
        }
        row.innerHTML = `
          <td>${app.app_name}</td>
          <td>${app.status}</td>
          <td>${downloadLink}</td>
        `;
        appList.appendChild(row);
      });

    } catch (error) {
      console.error(error);
    }
  };

  document.getElementById('create-app-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    formData.append('whatsapp_number', whatsappNumber);

    try {
      const response = await fetch('http://localhost:3000/api/apps', {
        method: 'POST',
        body: formData,
      });
      if(response.ok) {
        alert('App creation process started!');
        fetchUserData();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
  });

  fetchUserData();
});
