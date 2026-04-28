const ENABLED_CLASS = 'gemini-horizon-enabled';

function setExtensionState(enabled) {
  document.documentElement.classList.toggle(ENABLED_CLASS, enabled);
}

function injectUI(enabled) {
  if (document.getElementById('gemini-pp-btn')) return;

  const advUpsell = document.querySelector('.buttons-container.adv-upsell');
  const targetContainer = document.querySelector('.buttons-container:not(.adv-upsell)') || advUpsell;
  
  if (!targetContainer) return;

  const logoUrl = chrome.runtime.getURL('assets/icon.png');

  // Create Toggle Button
  const btn = document.createElement('button');
  btn.id = 'gemini-pp-btn';
  btn.title = 'Gemini Horizon Settings';
  btn.innerHTML = `<img src="${logoUrl}" alt="Gemini Horizon" style="width:24px;height:24px;display:block;">`;
  
  // Inject at the beginning of the target container
  targetContainer.insertBefore(btn, targetContainer.firstChild);

  // If we injected into the main container, hide the upsell container if it's empty
  if (advUpsell && targetContainer !== advUpsell && advUpsell.children.length === 0) {
    advUpsell.style.display = 'none';
  }

  // Create Settings Modal
  const modal = document.createElement('div');
  modal.id = 'gemini-pp-modal';
  modal.className = 'user-query-bubble-with-background';
  modal.style.display = 'none';
  modal.innerHTML = `
    <span class="horizontal-container">
      <div class="query-text gds-body-l">
        <div class="gemini-pp-header">
          <img src="${logoUrl}" alt="Gemini Horizon" style="width:20px;height:20px;vertical-align:middle;">
          <button id="gemini-pp-close" title="Close">&#x00D7;</button>
        </div>
        <div class="gemini-pp-row">
          <span class="gds-label-l">Full Width Mode</span>
          <label class="gemini-pp-switch">
            <input type="checkbox" id="gemini-pp-toggle" ${enabled ? 'checked' : ''} />
            <span class="gemini-pp-slider"></span>
          </label>
        </div>
      </div>
    </span>
  `;
  document.body.appendChild(modal);

  // Modal Positioning Logic
  function updateModalPosition() {
    const rect = btn.getBoundingClientRect();
    modal.style.top = (rect.bottom + 8) + 'px';
    modal.style.right = (window.innerWidth - rect.right) + 'px';
  }

  // Event Listeners
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (modal.style.display === 'none') {
      updateModalPosition();
      modal.style.display = 'block';
    } else {
      modal.style.display = 'none';
    }
  });

  modal.querySelector('#gemini-pp-close').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    if (modal.style.display !== 'none' && !modal.contains(e.target) && e.target !== btn) {
      modal.style.display = 'none';
    }
  });

  const toggle = modal.querySelector('#gemini-pp-toggle');
  toggle.addEventListener('change', () => {
    const isEnabled = toggle.checked;
    chrome.storage.sync.set({ enabled: isEnabled });
    setExtensionState(isEnabled);
  });
}

function waitAndInject(enabled) {
  // Try immediate injection
  if (document.querySelector('.buttons-container')) {
    injectUI(enabled);
    return;
  }

  // Use MutationObserver for dynamic page loads
  const observer = new MutationObserver(() => {
    if (!document.getElementById('gemini-pp-btn') &&
        document.querySelector('.buttons-container')) {
      injectUI(enabled);
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

// Initialize Extension
chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  setExtensionState(enabled);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitAndInject(enabled));
  } else {
    waitAndInject(enabled);
  }
});
