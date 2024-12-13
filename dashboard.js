class DashboardManager {
  constructor() {
    this.initializeElements();
    this.setupDragAndDrop();
    this.setupEventListeners();
    this.loadSettings();
    this.startPreviewClock();
  }

  initializeElements() {
    // Clock preview
    this.previewClock = document.getElementById('previewClock');
    
    // Format controls
    this.format24h = document.getElementById('format24h');
    this.showSeconds = document.getElementById('showSeconds');
    this.showDate = document.getElementById('showDate');
    
    // Appearance controls
    this.clockTheme = document.getElementById('clockTheme');
    this.fontSize = document.getElementById('fontSize');
    this.opacity = document.getElementById('opacity');
    this.textColor = document.getElementById('textColor');
    this.bgColor = document.getElementById('bgColor');
    
    // General controls
    this.clockEnabled = document.getElementById('clockEnabled');
    
    // Backup controls
    this.exportBtn = document.getElementById('exportSettings');
    this.importBtn = document.getElementById('importSettings');
    this.settingsFile = document.getElementById('settingsFile');
    this.resetAllBtn = document.getElementById('resetAll');
  }

  setupEventListeners() {
    // Format toggles
    this.format24h.addEventListener('change', () => this.updateSettings());
    this.showSeconds.addEventListener('change', () => this.updateSettings());
    this.showDate.addEventListener('change', () => this.updateSettings());
    
    // Appearance controls
    this.clockTheme.addEventListener('change', () => this.updateSettings());
    this.fontSize.addEventListener('input', () => {
      this.updateValueDisplay(this.fontSize, 'px');
      this.updateSettings();
    });
    this.opacity.addEventListener('input', () => {
      this.updateValueDisplay(this.opacity, '%');
      this.updateSettings();
    });
    this.textColor.addEventListener('change', () => this.updateSettings());
    this.bgColor.addEventListener('change', () => this.updateSettings());
    
    // General controls
    this.clockEnabled.addEventListener('change', () => this.updateSettings());
    
    // Position presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handlePresetPosition(btn.dataset.position));
    });
    
    // Backup controls
    this.exportBtn.addEventListener('click', () => this.exportSettings());
    this.importBtn.addEventListener('click', () => this.settingsFile.click());
    this.settingsFile.addEventListener('change', (e) => this.importSettings(e));
    this.resetAllBtn.addEventListener('click', () => this.resetAllSettings());
  }

  setupDragAndDrop() {
    let isDragging = false;
    let startX, startY;
    let originalX, originalY;

    this.previewClock.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      originalX = parseInt(this.previewClock.style.right || 20);
      originalY = parseInt(this.previewClock.style.top || 20);
      
      this.previewClock.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = startX - e.clientX;
      const deltaY = e.clientY - startY;
      
      const container = this.previewClock.parentElement;
      const newX = Math.max(0, Math.min(container.clientWidth - this.previewClock.offsetWidth, originalX + deltaX));
      const newY = Math.max(0, Math.min(container.clientHeight - this.previewClock.offsetHeight, originalY + deltaY));
      
      this.previewClock.style.right = `${newX}px`;
      this.previewClock.style.top = `${newY}px`;
      
      this.settings.position = { x: newX, y: newY };
      this.saveSettings();
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.previewClock.style.cursor = 'move';
      }
    });
  }

  handlePresetPosition(position) {
    const container = this.previewClock.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const clockWidth = this.previewClock.offsetWidth;
    const clockHeight = this.previewClock.offsetHeight;
    
    const positions = {
      'top-left': { x: width - clockWidth - 20, y: 20 },
      'top-center': { x: (width - clockWidth) / 2, y: 20 },
      'top-right': { x: 20, y: 20 },
      'middle-left': { x: width - clockWidth - 20, y: (height - clockHeight) / 2 },
      'middle-center': { x: (width - clockWidth) / 2, y: (height - clockHeight) / 2 },
      'middle-right': { x: 20, y: (height - clockHeight) / 2 },
      'bottom-left': { x: width - clockWidth - 20, y: height - clockHeight - 20 },
      'bottom-center': { x: (width - clockWidth) / 2, y: height - clockHeight - 20 },
      'bottom-right': { x: 20, y: height - clockHeight - 20 }
    };

    const newPos = positions[position];
    if (newPos) {
      this.previewClock.style.right = `${newPos.x}px`;
      this.previewClock.style.top = `${newPos.y}px`;
      this.settings.position = newPos;
      this.saveSettings();
    }
  }

  updateValueDisplay(element, unit) {
    const display = element.nextElementSibling;
    if (display) {
      display.textContent = `${element.value}${unit}`;
    }
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
    this.settings = result.clockSettings || {
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
    
    this.updateUIFromSettings();
  }

  updateUIFromSettings() {
    // Update toggles
    this.format24h.checked = this.settings.format24h;
    this.showSeconds.checked = this.settings.showSeconds;
    this.showDate.checked = this.settings.showDate;
    this.clockEnabled.checked = this.settings.enabled;
    
    // Update appearance controls
    this.clockTheme.value = this.settings.theme;
    this.fontSize.value = this.settings.fontSize;
    this.opacity.value = this.settings.opacity;
    this.textColor.value = this.settings.textColor;
    this.bgColor.value = this.settings.bgColor;
    
    // Update value displays
    this.updateValueDisplay(this.fontSize, 'px');
    this.updateValueDisplay(this.opacity, '%');
    
    // Update preview clock
    this.updatePreviewClockAppearance();
    this.previewClock.style.right = `${this.settings.position.x}px`;
    this.previewClock.style.top = `${this.settings.position.y}px`;
  }

  updatePreviewClockAppearance() {
    const opacity = this.settings.opacity / 100;
    const backgroundColor = this.hexToRGBA(this.settings.bgColor, opacity);
    
    Object.assign(this.previewClock.style, {
      fontSize: `${this.settings.fontSize}px`,
      color: this.settings.textColor,
      backgroundColor
    });
    
    this.previewClock.dataset.theme = this.settings.theme;
  }

  hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  updateSettings() {
    this.settings = {
      enabled: this.clockEnabled.checked,
      position: this.settings.position,
      format24h: this.format24h.checked,
      showSeconds: this.showSeconds.checked,
      showDate: this.showDate.checked,
      theme: this.clockTheme.value,
      fontSize: parseInt(this.fontSize.value),
      opacity: parseInt(this.opacity.value),
      textColor: this.textColor.value,
      bgColor: this.bgColor.value
    };
    
    this.saveSettings();
    this.updatePreviewClockAppearance();
  }

  async saveSettings() {
    await chrome.storage.sync.set({ clockSettings: this.settings });
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
      this.settings = { ...this.settings, ...newSettings };
      this.updateUIFromSettings();
      this.saveSettings();
    } catch (error) {
      console.error('Error importing settings:', error);
      alert('Error importing settings. Please check the file format.');
    }
    event.target.value = '';
  }

  resetAllSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.settings = {
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
      this.updateUIFromSettings();
      this.saveSettings();
    }
  }
}

// Initialize the dashboard
new DashboardManager(); 