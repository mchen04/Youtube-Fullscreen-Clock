class BackgroundManager {
  constructor() {
    this.setupMessageListeners();
  }

  setupMessageListeners() {
    // Listen for settings changes and broadcast to all YouTube tabs
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.clockSettings) {
        this.broadcastSettingsToTabs(changes.clockSettings.newValue);
      }
    });
  }

  async broadcastSettingsToTabs(settings) {
    // Query for all YouTube tabs
    const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
    
    // Send updated settings to each tab
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_UPDATED',
        settings
      }).catch(() => {
        // Ignore errors for inactive tabs
      });
    });
  }
}

// Initialize the background manager
new BackgroundManager(); 