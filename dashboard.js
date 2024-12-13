class DashboardManager {
  constructor() {
    this.initializeElements();
    this.defaultSettings = {
      enabled: true,
      position: { x: 20, y: 20 },
      format24h: false,
      showSeconds: false,
      showDate: false,
      theme: 'minimal',
      fontSize: 16,
      opacity: 80,
      textColor: '#ffffff',
      bgColor: '#000000'
    };
    
    this.settings = { ...this.defaultSettings };
    this.init();
  }

  initializeElements() {
    // Clock preview
    this.previewClock = document.getElementById('previewClock');
    
    // Basic toggles
    this.clockEnabled = document.getElementById('clockEnabled');
    this.format24h = document.getElementById('format24h');
    this.showSeconds = document.getElementById('showSeconds');
    this.showDate = document.getElementById('showDate');
    
    // Appearance controls
    this.clockTheme = document.getElementById('clockTheme');
    this.fontSize = document.getElementById('fontSize');
    this.opacity = document.getElementById('opacity');
    this.textColor = document.getElementById('textColor');
    this.bgColor = document.getElementById('bgColor');
    
    // Buttons
    this.exportBtn = document.getElementById('exportSettings');
    this.importBtn = document.getElementById('importSettings');
    this.settingsFile = document.getElementById('settingsFile');
    this.resetAllBtn = document.getElementById('resetAll');
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updatePreviewClock();
    this.startPreviewClock();
    this.setupKeyboardShortcuts();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get({
      clockSettings: this.defaultSettings
    });
    this.settings = result.clockSettings;
    this.updateUIFromSettings();
  }

  updateUIFromSettings() {
    // Update toggles
    this.clockEnabled.checked = this.settings.enabled;
    this.format24h.checked = this.settings.format24h;
    this.showSeconds.checked = this.settings.showSeconds;
    this.showDate.checked = this.settings.showDate;
    
    // Update appearance controls
    this.clockTheme.value = this.settings.theme;
    this.fontSize.value = this.settings.fontSize;
    this.opacity.value = this.settings.opacity;
    this.textColor.value = this.settings.textColor;
    this.bgColor.value = this.settings.bgColor;
    
    // Update value displays
    this.updateValueDisplays();
    
    // Update preview clock appearance
    this.updateClockAppearance();
    this.updateClockPosition();
  }

  updateValueDisplays() {
    this.fontSize.nextElementSibling.textContent = `${this.settings.fontSize}px`;
    this.opacity.nextElementSibling.textContent = `${this.settings.opacity}%`;
  }

  setupEventListeners() {
    // Position presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handlePresetPosition(btn.dataset.position));
    });

    // Basic toggles
    this.clockEnabled.addEventListener('change', () => {
      this.settings.enabled = this.clockEnabled.checked;
      this.saveSettings();
    });

    this.format24h.addEventListener('change', () => {
      this.settings.format24h = this.format24h.checked;
      this.saveSettings();
    });

    this.showSeconds.addEventListener('change', () => {
      this.settings.showSeconds = this.showSeconds.checked;
      this.saveSettings();
    });

    this.showDate.addEventListener('change', () => {
      this.settings.showDate = this.showDate.checked;
      this.saveSettings();
    });

    // Appearance controls
    this.clockTheme.addEventListener('change', () => {
      this.settings.theme = this.clockTheme.value;
      this.updateClockAppearance();
      this.saveSettings();
    });

    this.fontSize.addEventListener('input', () => {
      this.settings.fontSize = parseInt(this.fontSize.value);
      this.updateValueDisplays();
      this.updateClockAppearance();
      this.saveSettings();
    });

    this.opacity.addEventListener('input', () => {
      this.settings.opacity = parseInt(this.opacity.value);
      this.updateValueDisplays();
      this.updateClockAppearance();
      this.saveSettings();
    });

    this.textColor.addEventListener('input', () => {
      this.settings.textColor = this.textColor.value;
      this.updateClockAppearance();
      this.saveSettings();
    });

    this.bgColor.addEventListener('input', () => {
      this.settings.bgColor = this.bgColor.value;
      this.updateClockAppearance();
      this.saveSettings();
    });

    // Drag and drop
    this.previewClock.addEventListener('dragstart', this.handleDragStart.bind(this));
    document.querySelector('.video-area').addEventListener('dragover', this.handleDragOver.bind(this));
    document.querySelector('.video-area').addEventListener('drop', this.handleDrop.bind(this));

    // Backup & Restore
    this.exportBtn.addEventListener('click', () => this.exportSettings());
    this.importBtn.addEventListener('click', () => this.settingsFile.click());
    this.settingsFile.addEventListener('change', (e) => this.importSettings(e));
    this.resetAllBtn.addEventListener('click', () => this.resetAllSettings());
  }

  handlePresetPosition(position) {
    const videoArea = document.querySelector('.video-area');
    const rect = videoArea.getBoundingClientRect();
    const padding = 20;
    
    const positions = {
      'top-left': { x: rect.width - padding, y: padding },
      'top-center': { x: rect.width / 2, y: padding },
      'top-right': { x: padding, y: padding },
      'middle-left': { x: rect.width - padding, y: rect.height / 2 },
      'middle-center': { x: rect.width / 2, y: rect.height / 2 },
      'middle-right': { x: padding, y: rect.height / 2 },
      'bottom-left': { x: rect.width - padding, y: rect.height - padding },
      'bottom-center': { x: rect.width / 2, y: rect.height - padding },
      'bottom-right': { x: padding, y: rect.height - padding }
    };

    this.settings.position = positions[position];
    this.updateClockPosition();
    this.saveSettings();
  }

  updateClockAppearance() {
    const themes = {
      minimal: {
        fontFamily: 'Roboto, Arial, sans-serif',
        padding: '4px 8px',
        borderRadius: '4px',
        fontWeight: 'normal'
      },
      modern: {
        fontFamily: 'Inter, sans-serif',
        padding: '6px 12px',
        borderRadius: '8px',
        fontWeight: '500'
      },
      retro: {
        fontFamily: '"Digital-7", monospace',
        padding: '4px 8px',
        borderRadius: '0',
        fontWeight: 'normal'
      },
      elegant: {
        fontFamily: 'Playfair Display, serif',
        padding: '6px 12px',
        borderRadius: '16px',
        fontWeight: '500'
      }
    };

    const theme = themes[this.settings.theme];
    const opacity = this.settings.opacity / 100;
    const backgroundColor = this.hexToRGBA(this.settings.bgColor, opacity);

    Object.assign(this.previewClock.style, {
      fontSize: `${this.settings.fontSize}px`,
      color: this.settings.textColor,
      backgroundColor,
      ...theme
    });
  }

  hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey) {
        if (e.key === 'c') {
          this.clockEnabled.checked = !this.clockEnabled.checked;
          this.settings.enabled = this.clockEnabled.checked;
          this.saveSettings();
        } else if (e.key === 'f') {
          this.format24h.checked = !this.format24h.checked;
          this.settings.format24h = this.format24h.checked;
          this.saveSettings();
        }
      }
    });
  }

  exportSettings() {
    const blob = new Blob([JSON.stringify(this.settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'youtube-clock-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const newSettings = JSON.parse(text);
      this.settings = { ...this.defaultSettings, ...newSettings };
      this.updateUIFromSettings();
      this.saveSettings();
    } catch (error) {
      console.error('Error importing settings:', error);
      alert('Error importing settings. Please check the file format.');
    }
    event.target.value = ''; // Reset file input
  }

  resetAllSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.settings = { ...this.defaultSettings };
      this.updateUIFromSettings();
      this.saveSettings();
    }
  }

  // ... (keep existing methods for drag and drop, position updates, etc.)
}

// Initialize the dashboard
new DashboardManager(); 