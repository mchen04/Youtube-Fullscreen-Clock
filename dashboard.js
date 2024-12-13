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
    const SNAP_THRESHOLD = 15; // Distance in pixels to trigger snapping
    const PADDING = 20;

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
      const containerRect = container.getBoundingClientRect();
      const clockRect = this.previewClock.getBoundingClientRect();
      
      // Calculate initial position
      let newX = Math.max(
        PADDING,
        Math.min(
          containerRect.width - clockRect.width - PADDING,
          originalX + deltaX
        )
      );
      
      let newY = Math.max(
        PADDING,
        Math.min(
          containerRect.height - clockRect.height - PADDING,
          originalY + deltaY
        )
      );

      // Edge snapping logic
      const snapPoints = {
        x: [
          PADDING, // Left edge
          containerRect.width - clockRect.width - PADDING, // Right edge
          (containerRect.width - clockRect.width) / 2 // Center horizontally
        ],
        y: [
          PADDING, // Top edge
          containerRect.height - clockRect.height - PADDING, // Bottom edge
          (containerRect.height - clockRect.height) / 2 // Center vertically
        ]
      };

      // Snap to X positions
      for (const snapX of snapPoints.x) {
        if (Math.abs(newX - snapX) < SNAP_THRESHOLD) {
          newX = snapX;
          // Show snap indicator
          this.showSnapIndicator('x', snapX);
          break;
        }
      }

      // Snap to Y positions
      for (const snapY of snapPoints.y) {
        if (Math.abs(newY - snapY) < SNAP_THRESHOLD) {
          newY = snapY;
          // Show snap indicator
          this.showSnapIndicator('y', snapY);
          break;
        }
      }
      
      this.previewClock.style.right = `${newX}px`;
      this.previewClock.style.top = `${newY}px`;
      
      // Calculate ratios for the actual video player
      const xRatio = (containerRect.width - newX - clockRect.width / 2) / containerRect.width;
      const yRatio = (newY + clockRect.height / 2) / containerRect.height;
      
      this.settings.position = {
        x: newX,
        y: newY,
        xRatio,
        yRatio
      };
      
      this.saveSettings();
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.previewClock.style.cursor = 'move';
        this.hideSnapIndicators();
      }
    });
  }

  handlePresetPosition(position) {
    const PADDING = 20;
    const container = this.previewClock.parentElement;
    const containerRect = container.getBoundingClientRect();
    
    // Define positions using ratios (0 = left, 0.5 = center, 1 = right)
    const positions = {
      'top-left': { xRatio: 1, yRatio: 0 },      // Inverted because we're using right alignment
      'top-center': { xRatio: 0.5, yRatio: 0 },
      'top-right': { xRatio: 0, yRatio: 0 },     // Inverted because we're using right alignment
      'middle-left': { xRatio: 1, yRatio: 0.5 },  // Inverted because we're using right alignment
      'middle-center': { xRatio: 0.5, yRatio: 0.5 },
      'middle-right': { xRatio: 0, yRatio: 0.5 }, // Inverted because we're using right alignment
      'bottom-left': { xRatio: 1, yRatio: 1 },    // Inverted because we're using right alignment
      'bottom-center': { xRatio: 0.5, yRatio: 1 },
      'bottom-right': { xRatio: 0, yRatio: 1 }    // Inverted because we're using right alignment
    };

    const pos = positions[position];
    if (pos) {
      let x, y;

      // Calculate y position
      if (pos.yRatio === 0) { // Top
        y = PADDING;
      } else if (pos.yRatio === 0.5) { // Middle
        y = (containerRect.height / 2) - (this.previewClock.offsetHeight / 2);
      } else { // Bottom
        y = containerRect.height - this.previewClock.offsetHeight - PADDING;
      }

      // Calculate x position (using right alignment)
      if (pos.xRatio === 0) { // Right
        x = PADDING;
      } else if (pos.xRatio === 0.5) { // Center
        x = (containerRect.width / 2) - (this.previewClock.offsetWidth / 2);
        x = containerRect.width - x - this.previewClock.offsetWidth; // Convert to right alignment
      } else { // Left
        x = containerRect.width - this.previewClock.offsetWidth - PADDING;
      }

      // Update preview
      this.previewClock.style.right = `${x}px`;
      this.previewClock.style.top = `${y}px`;
      
      // Save settings with ratios
      this.settings.position = {
        x,
        y,
        xRatio: pos.xRatio,
        yRatio: pos.yRatio
      };
      
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
}

// Initialize the dashboard
new DashboardManager(); 