class YouTubeFullscreenClock {
  constructor() {
    this.clockElement = null;
    this.isFullscreen = false;
    this.settings = {
      enabled: true,
      position: { 
        x: 20, 
        y: 20,
        corner: 'top-left'
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
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupFullscreenListener();
    this.setupMessageListener();
    this.setupKeyboardShortcuts();
    this.createClockElement();
    this.handleInitialState();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get({
      clockSettings: this.settings
    });
    this.settings = result.clockSettings;
  }

  createClockElement() {
    if (this.clockElement) return;

    this.clockElement = document.createElement('div');
    this.clockElement.id = 'yt-fullscreen-clock';
    this.updateClockAppearance();
    this.updateClockPosition();
    this.startClock();
  }

  updateClockPosition() {
    if (!this.clockElement) return;

    const PADDING = 20;
    const container = document.fullscreenElement || document.getElementById('player-theater-container');
    
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const clockRect = this.clockElement.getBoundingClientRect();

    let x, y;

    // Handle preset corner positions
    switch (this.settings.position.corner) {
      case 'top-left':
        x = PADDING;
        y = PADDING;
        break;
      case 'top-right':
        x = containerRect.width - clockRect.width - PADDING;
        y = PADDING;
        break;
      case 'bottom-left':
        x = PADDING;
        y = containerRect.height - clockRect.height - PADDING;
        break;
      case 'bottom-right':
        x = containerRect.width - clockRect.width - PADDING;
        y = containerRect.height - clockRect.height - PADDING;
        break;
      case 'top-center':
        x = (containerRect.width - clockRect.width) / 2;
        y = PADDING;
        break;
      default:
        // Custom position - use saved x,y coordinates
        x = this.settings.position.x;
        y = this.settings.position.y;
    }

    // Apply the calculated position
    this.clockElement.style.left = `${x}px`;
    this.clockElement.style.top = `${y}px`;
    
    // Update stored position
    this.settings.position.x = x;
    this.settings.position.y = y;
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

    Object.assign(this.clockElement.style, {
      position: 'fixed',
      zIndex: '9999',
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

  startClock() {
    const updateTime = () => {
      if (this.clockElement) {
        this.clockElement.textContent = this.formatTime(new Date());
      }
    };
    
    updateTime();
    setInterval(updateTime, 1000);
  }

  setupFullscreenListener() {
    // Listen for native fullscreen
    document.addEventListener('fullscreenchange', () => {
      this.handleFullscreenChange();
    });

    // Listen for YouTube's theater mode
    const observer = new MutationObserver(() => {
      this.handleTheaterModeChange();
    });

    // Start observing the player
    const playerContainer = document.getElementById('player-theater-container');
    if (playerContainer) {
      observer.observe(playerContainer, { attributes: true });
    }

    // Add resize listener
    window.addEventListener('resize', () => {
      if (this.isFullscreen || document.getElementById('player-theater-container')) {
        this.updateClockPosition();
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SETTINGS_UPDATED') {
        this.handleSettingsUpdate(message.settings);
      }
      sendResponse({ success: true });
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey) {
        if (e.key === 'c') {
          this.settings.enabled = !this.settings.enabled;
          this.saveSettings();
          this.handleFullscreenChange();
        } else if (e.key === 'f') {
          this.settings.format24h = !this.settings.format24h;
          this.saveSettings();
        }
      }
    });
  }

  async saveSettings() {
    await chrome.storage.sync.set({
      clockSettings: this.settings
    });
  }

  handleSettingsUpdate(newSettings) {
    this.settings = newSettings;
    this.updateClockPosition();
    this.updateClockAppearance();
    
    if (this.isFullscreen) {
      if (this.settings.enabled && !this.clockElement.parentElement) {
        this.showClock();
      } else if (!this.settings.enabled && this.clockElement.parentElement) {
        this.hideClock();
      }
    }
  }

  handleFullscreenChange() {
    const isNativeFullscreen = !!document.fullscreenElement;
    this.isFullscreen = isNativeFullscreen;
    
    if (isNativeFullscreen && this.settings.enabled) {
      this.showClock();
      this.updateClockPosition();
    } else {
      this.hideClock();
    }
  }

  handleTheaterModeChange() {
    const playerContainer = document.getElementById('player-theater-container');
    const isTheaterMode = playerContainer && playerContainer.style.display !== 'none';
    
    if (isTheaterMode && this.settings.enabled) {
      this.showClock();
      this.updateClockPosition();
    } else if (!isTheaterMode) {
      this.hideClock();
    }
  }

  handleInitialState() {
    // Check if already in theater mode or fullscreen on page load
    const isTheaterMode = document.getElementById('player-theater-container')?.style.display !== 'none';
    const isFullscreen = !!document.fullscreenElement;
    
    if ((isTheaterMode || isFullscreen) && this.settings.enabled) {
      this.showClock();
    }
  }

  showClock() {
    const container = document.fullscreenElement || document.getElementById('player-theater-container');
    if (container && !this.clockElement.parentElement) {
      container.appendChild(this.clockElement);
    }
  }

  hideClock() {
    if (this.clockElement.parentElement) {
      this.clockElement.parentElement.removeChild(this.clockElement);
    }
  }
}

// Initialize the clock
new YouTubeFullscreenClock(); 