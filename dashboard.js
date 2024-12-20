class DashboardManager {
  constructor() {
    this.settings = {
      enabled: true,
      position: { 
        corner: 'top-right' // Default corner
      },
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
    this.settingsPreviewClock = document.getElementById('settingsPreviewClock');
    this.startSettingsPreview();
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
    
    // Add position buttons
    this.positionButtons = document.querySelectorAll('.position-btn');
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
    
    // Position buttons
    this.positionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const position = button.dataset.position;
        this.handlePositionChange(position);
      });
    });
    
    // Backup controls
    this.exportBtn.addEventListener('click', () => this.exportSettings());
    this.importBtn.addEventListener('click', () => this.settingsFile.click());
    this.settingsFile.addEventListener('change', (e) => this.importSettings(e));
    this.resetAllBtn.addEventListener('click', () => this.resetAllSettings());
  }

  handlePositionChange(corner) {
    const container = this.previewClock.parentElement;
    const containerRect = container.getBoundingClientRect();
    const clockRect = this.previewClock.getBoundingClientRect();
    const PADDING = 20;

    // Update button states
    this.positionButtons.forEach(button => {
      button.setAttribute('data-active', button.dataset.position === corner);
    });

    // Position the clock
    switch (corner) {
      case 'top-left':
        this.previewClock.style.left = `${PADDING}px`;
        this.previewClock.style.top = `${PADDING}px`;
        break;
      case 'top-center':
        this.previewClock.style.left = `${(containerRect.width - clockRect.width) / 2}px`;
        this.previewClock.style.top = `${PADDING}px`;
        break;
      case 'top-right':
        this.previewClock.style.left = `${containerRect.width - clockRect.width - PADDING}px`;
        this.previewClock.style.top = `${PADDING}px`;
        break;
    }

    // Save settings
    this.settings.position = { corner };
    this.saveSettings();
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
      position: { 
        x: 20, 
        y: 20,
        corner: 'top-right' // Default to top-right
      },
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
    this.previewClock.style.left = `${this.settings.position.x}px`;
    this.previewClock.style.top = `${this.settings.position.y}px`;
    
    // Update position button states
    const activeCorner = this.settings.position.corner || 'top-right';
    this.positionButtons.forEach(button => {
      button.setAttribute('data-active', button.dataset.position === activeCorner);
    });

    // Position the preview clock
    this.handlePositionChange(activeCorner);
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
    
    // Update the settings preview
    if (this.settingsPreviewClock) {
      const opacity = this.settings.opacity / 100;
      const backgroundColor = this.hexToRGBA(this.settings.bgColor, opacity);
      
      Object.assign(this.settingsPreviewClock.style, {
        fontSize: `${this.settings.fontSize}px`,
        color: this.settings.textColor,
        backgroundColor,
        fontFamily: this.getThemeFont(this.settings.theme),
        padding: this.getThemePadding(this.settings.theme),
        borderRadius: this.getThemeBorderRadius(this.settings.theme)
      });
    }
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

  // Add these helper methods to show visual feedback for snapping
  showSnapIndicator(axis, position) {
    let indicator = document.getElementById(`snap-indicator-${axis}`);
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = `snap-indicator-${axis}`;
      indicator.className = 'snap-indicator';
      this.previewClock.parentElement.appendChild(indicator);
    }

    if (axis === 'x') {
      indicator.style.height = '100%';
      indicator.style.width = '1px';
      indicator.style.left = `${position}px`;
      indicator.style.top = '0';
    } else {
      indicator.style.width = '100%';
      indicator.style.height = '1px';
      indicator.style.top = `${position}px`;
      indicator.style.left = '0';
    }

    indicator.style.opacity = '1';
  }

  hideSnapIndicators() {
    const indicators = document.querySelectorAll('.snap-indicator');
    indicators.forEach(indicator => {
      indicator.style.opacity = '0';
    });
  }

  setupDragAndDrop() {
    let isDragging = false;
    let startX, startY;
    let originalX, originalY;
    
    this.previewClock.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = this.previewClock.getBoundingClientRect();
      originalX = rect.left;
      originalY = rect.top;
      
      this.previewClock.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const container = this.previewClock.parentElement;
      const containerRect = container.getBoundingClientRect();
      const clockRect = this.previewClock.getBoundingClientRect();
      
      let newX = Math.max(
        0,
        Math.min(
          containerRect.width - clockRect.width,
          originalX + deltaX - containerRect.left
        )
      );
      
      let newY = Math.max(
        0,
        Math.min(
          containerRect.height - clockRect.height,
          originalY + deltaY - containerRect.top
        )
      );

      this.updatePosition(newX, newY);
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.previewClock.style.cursor = 'move';
        this.saveSettings();
      }
    });
  }

  setupDirectionalControls() {
    const MOVE_STEP = 10; // pixels to move per click
    
    document.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const direction = btn.dataset.direction;
        const container = this.previewClock.parentElement;
        const containerRect = container.getBoundingClientRect();
        const clockRect = this.previewClock.getBoundingClientRect();
        const currentX = clockRect.left - containerRect.left;
        const currentY = clockRect.top - containerRect.top;

        let newX = currentX;
        let newY = currentY;

        switch (direction) {
          case 'up':
            newY = Math.max(0, currentY - MOVE_STEP);
            break;
          case 'down':
            newY = Math.min(containerRect.height - clockRect.height, currentY + MOVE_STEP);
            break;
          case 'left':
            newX = Math.max(0, currentX - MOVE_STEP);
            break;
          case 'right':
            newX = Math.min(containerRect.width - clockRect.width, currentX + MOVE_STEP);
            break;
          case 'center':
            newX = (containerRect.width - clockRect.width) / 2;
            newY = (containerRect.height - clockRect.height) / 2;
            break;
        }

        this.updatePosition(newX, newY);
        this.saveSettings();
      });
    });
  }

  updatePosition(x, y) {
    this.previewClock.style.left = `${x}px`;
    this.previewClock.style.top = `${y}px`;
    
    // Update settings with position ratios
    const container = this.previewClock.parentElement;
    const containerRect = container.getBoundingClientRect();
    
    this.settings.position = {
      xRatio: x / containerRect.width,
      yRatio: y / containerRect.height
    };
  }

  startSettingsPreview() {
    const updatePreview = () => {
      if (this.settingsPreviewClock) {
        this.settingsPreviewClock.textContent = this.formatTime(new Date());
        
        // Apply current settings to preview
        const opacity = this.settings.opacity / 100;
        const backgroundColor = this.hexToRGBA(this.settings.bgColor, opacity);
        
        Object.assign(this.settingsPreviewClock.style, {
          fontSize: `${this.settings.fontSize}px`,
          color: this.settings.textColor,
          backgroundColor,
          fontFamily: this.getThemeFont(this.settings.theme),
          padding: this.getThemePadding(this.settings.theme),
          borderRadius: this.getThemeBorderRadius(this.settings.theme)
        });
      }
    };
    
    updatePreview();
    setInterval(updatePreview, 1000);
  }

  getThemeFont(theme) {
    const themes = {
      minimal: 'Roboto, Arial, sans-serif',
      modern: 'Inter, sans-serif',
      retro: '"Digital-7", monospace',
      elegant: 'Playfair Display, serif'
    };
    return themes[theme] || themes.minimal;
  }

  getThemePadding(theme) {
    const paddings = {
      minimal: '4px 8px',
      modern: '6px 12px',
      retro: '4px 8px',
      elegant: '6px 12px'
    };
    return paddings[theme] || paddings.minimal;
  }

  getThemeBorderRadius(theme) {
    const radiuses = {
      minimal: '4px',
      modern: '8px',
      retro: '0',
      elegant: '16px'
    };
    return radiuses[theme] || radiuses.minimal;
  }
}

// Initialize the dashboard
new DashboardManager(); 