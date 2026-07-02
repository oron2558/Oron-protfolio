export class InputHandler {
  constructor() {
    this.swingCallback = null;
    this.directionBias = 'cross';
    this.connected = false;
    this._ws = null;
  }

  /** Register the callback that fires when a swing is detected. */
  onSwing(cb) {
    this.swingCallback = cb;
  }

  /** Attach keyboard, touch, and button listeners. */
  init(directionCb) {
    this._directionCb = directionCb || null;

    document.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this._fire(this.directionBias);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.directionBias = 'cross';
          if (this._directionCb) this._directionCb('cross');
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.directionBias = 'down_the_line';
          if (this._directionCb) this._directionCb('down_the_line');
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.directionBias = 'lob';
          if (this._directionCb) this._directionCb('lob');
          break;
        default:
          break;
      }
    });

    // Mobile tap anywhere
    document.addEventListener('touchstart', (e) => {
      // Ignore taps on interactive elements (handled separately)
      if (e.target.id === 'swing-btn') return;
      this._fire(this.directionBias);
    });

    // Dedicated swing button (mobile UI)
    const btn = document.getElementById('swing-btn');
    if (btn) {
      btn.addEventListener('click', () => this._fire(this.directionBias));
    }
  }

  /**
   * Attempt to connect to a WebSocket sensor bridge.
   * Falls back silently to keyboard if the socket is unavailable.
   */
  connectSensor(wsUrl) {
    try {
      const ws = new WebSocket(wsUrl);
      this._ws = ws;

      ws.onopen = () => {
        this.connected = true;
        console.log('Sensor connected:', wsUrl);
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'swing') {
            this._fire(data.direction || this.directionBias);
          }
        } catch (parseErr) {
          console.warn('Sensor message parse error:', parseErr);
        }
      };

      ws.onclose = () => {
        this.connected = false;
        console.log('Sensor disconnected');
      };

      ws.onerror = () => {
        console.log('Sensor not connected, using keyboard');
        this.connected = false;
      };
    } catch (e) {
      console.log('WebSocket unavailable, using keyboard');
    }
  }

  /** Disconnect sensor WebSocket if open. */
  disconnectSensor() {
    if (this._ws) {
      this._ws.close();
      this._ws = null;
      this.connected = false;
    }
  }

  _fire(direction) {
    if (typeof this.swingCallback === 'function') {
      this.swingCallback(direction);
    }
  }
}
