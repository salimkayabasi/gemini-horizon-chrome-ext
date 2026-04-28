
describe('content.js', () => {
  let observerInstance;

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '';
    document.documentElement.className = '';
    observerInstance = null;

    global.MutationObserver = class {
      constructor(callback) {
        this.callback = callback;
        observerInstance = this;
      }
      observe = jest.fn();
      disconnect = jest.fn();
      trigger() {
        if (this.callback) this.callback([], this);
      }
    };
  });

  const runContentScript = (enabled = true) => {
    global.chrome = {
      runtime: {
        getURL: jest.fn((path) => `chrome-extension://id/${path}`),
      },
      storage: {
        sync: {
          get: jest.fn((defaults, callback) => {
            if (typeof defaults === 'object' && !Array.isArray(defaults)) {
              callback({ ...defaults, enabled });
            } else {
              callback({ enabled });
            }
          }),
          set: jest.fn(),
        },
      },
    };

    jest.isolateModules(() => {
      require('../src/content');
    });
  };

  test('should initialize and set state', () => {
    runContentScript(true);
    expect(document.documentElement.classList.contains('gemini-horizon-enabled')).toBe(true);
  });

  test('should inject UI if container exists', () => {
    document.body.innerHTML = '<div class="buttons-container adv-upsell"></div>';
    runContentScript(true);
    expect(document.getElementById('gemini-pp-btn')).not.toBeNull();
  });

  test('should wait for container using MutationObserver', () => {
    runContentScript(true);
    expect(document.getElementById('gemini-pp-btn')).toBeNull();
    
    document.body.innerHTML = '<div class="buttons-container adv-upsell"></div>';
    if (observerInstance) observerInstance.trigger();
    
    expect(document.getElementById('gemini-pp-btn')).not.toBeNull();
  });

  test('should handle enabled: false state', () => {
    document.body.innerHTML = '<div class="buttons-container adv-upsell"></div>';
    runContentScript(false);
    
    expect(document.documentElement.classList.contains('gemini-horizon-enabled')).toBe(false);
    const toggle = document.getElementById('gemini-pp-toggle');
    expect(toggle).not.toBeNull();
    expect(toggle.checked).toBe(false);
  });

  test('should toggle full width mode', () => {
    document.body.innerHTML = '<div class="buttons-container adv-upsell"></div>';
    runContentScript(true);

    const toggle = document.getElementById('gemini-pp-toggle');
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ enabled: false });
    expect(document.documentElement.classList.contains('gemini-horizon-enabled')).toBe(false);
  });

  test('should open and close modal', () => {
    document.body.innerHTML = '<div class="buttons-container adv-upsell"></div>';
    runContentScript(true);

    const btn = document.getElementById('gemini-pp-btn');
    const modal = document.getElementById('gemini-pp-modal');
    const closeBtn = document.getElementById('gemini-pp-close');

    btn.click();
    expect(modal.style.display).toBe('block');

    closeBtn.click();
    expect(modal.style.display).toBe('none');

    btn.click();
    btn.click(); // Toggle off
    expect(modal.style.display).toBe('none');
  });

  test('should close modal on outside click', () => {
    document.body.innerHTML = '<div class="buttons-container adv-upsell"></div>';
    runContentScript(true);

    const btn = document.getElementById('gemini-pp-btn');
    const modal = document.getElementById('gemini-pp-modal');

    btn.click();
    expect(modal.style.display).toBe('block');

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(modal.style.display).toBe('none');
  });

  test('should wait for DOMContentLoaded if readyState is loading', () => {
    Object.defineProperty(document, 'readyState', {
      get() { return 'loading'; },
      configurable: true
    });

    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    runContentScript(true);

    expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    
    const callback = addEventListenerSpy.mock.calls.find(call => call[0] === 'DOMContentLoaded')[1];
    callback();
    
    expect(chrome.storage.sync.get).toHaveBeenCalled();
  });

  test('should not inject UI if it already exists', () => {
    document.body.innerHTML = '<div class="buttons-container adv-upsell"><button id="gemini-pp-btn"></button></div>';
    runContentScript(true);
    expect(document.querySelectorAll('#gemini-pp-btn').length).toBe(1);
  });

  test('should return early if container is missing', () => {
    document.body.innerHTML = '<div></div>';
    runContentScript(true);
    expect(document.getElementById('gemini-pp-btn')).toBeNull();
  });

  test('should return early if container is missing', () => {
    document.body.innerHTML = '<div></div>';
    runContentScript(true);
    expect(document.getElementById('gemini-pp-btn')).toBeNull();
  });
});
