class PopupManager {
  constructor() {
    this.settings = {
      enabled: true,
      format24h: false,
      showSeconds: false,
      showDate: false,
      theme: 'minimal',
      fontSize: 16,
      opacity: 80,
      textColor: '#ffffff',
      bgColor: '#000000'
    };

    this.initializeElements();
    this.setupEventListeners();
    this.loadSettings();
    this.startPreviewClock();
  }

  initializeElements() {
    this.clockEnabled = document.getElementById('clockEnabled');
    this.format24h = document.getElementById('format24h');
    this.showSeconds = document.getElementById('showSeconds');
    this.openDashboard = document.getElementById('openDashboard');
    this.previewClock = document.getElementById('popupPreviewClock');
  }

  setupEventListeners() {
    this.clockEnabled.addEventListener('change', () => this.updateSettings());
    this.format24h.addEventListener('change', () => this.updateSettings());
    this.showSeconds.addEventListener('change', () => this.updateSettings());
    
    this.openDashboard.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
      window.close();
    });
  }

  startPreviewClock() {
    const updateTime = () => {
      if (this.previewClock) {
        this.previewClock.textContent = this.formatTime(new Date());
      }
    };
    
    updateTime();
    setInterval(updateTime, 1000);
  }

  formatTime(date) {
    let timeStr = '';
    
    if (this.settings.showDate) {
      timeStr += date.toLocaleDateString() + ' ';
    }
    
    if (this.settings.format24h) {
      timeStr += date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: this.settings.showSeconds ? '2-digit' : undefined
      });
    } else {
      timeStr += date.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
        second: this.settings.showSeconds ? '2-digit' : undefined
      });
    }
    
    return timeStr;
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get('clockSettings');
    if (result.clockSettings) {
      this.settings = result.clockSettings;
      this.updateUIFromSettings();
    }
  }

  updateUIFromSettings() {
    this.clockEnabled.checked = this.settings.enabled;
    this.format24h.checked = this.settings.format24h;
    this.showSeconds.checked = this.settings.showSeconds;
    
    this.updatePreviewClockAppearance();
  }

  updatePreviewClockAppearance() {
    if (!this.previewClock) return;

    const opacity = this.settings.opacity / 100;
    const backgroundColor = this.hexToRGBA(this.settings.bgColor, opacity);
    
    Object.assign(this.previewClock.style, {
      fontSize: `${this.settings.fontSize}px`,
      color: this.settings.textColor,
      backgroundColor
    });
  }

  hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  async updateSettings() {
    this.settings = {
      ...this.settings,
      enabled: this.clockEnabled.checked,
      format24h: this.format24h.checked,
      showSeconds: this.showSeconds.checked
    };
    
    await this.saveSettings();
    this.updatePreviewClockAppearance();
  }

  async saveSettings() {
    await chrome.storage.sync.set({ clockSettings: this.settings });
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings: this.settings });
  }
}

// Initialize the popup
new PopupManager(); 