document.addEventListener('DOMContentLoaded', async () => {
  const openDashboard = document.getElementById('openDashboard');
  const clockEnabled = document.getElementById('clockEnabled');

  // Load initial settings
  const { clockSettings = { enabled: true } } = await chrome.storage.sync.get('clockSettings');
  clockEnabled.checked = clockSettings.enabled;

  // Handle enable/disable toggle
  clockEnabled.addEventListener('change', async () => {
    const { clockSettings } = await chrome.storage.sync.get('clockSettings');
    clockSettings.enabled = clockEnabled.checked;
    await chrome.storage.sync.set({ clockSettings });
  });

  // Open dashboard in new tab
  openDashboard.addEventListener('click', () => {
    chrome.tabs.create({ url: 'dashboard.html' });
  });
}); 