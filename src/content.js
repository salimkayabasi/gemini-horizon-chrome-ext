const STYLE_ID = 'gemini-horizon-styles';

const CSS = `
  .conversation-container { max-width: unset !important; }
  .table-block            { max-width: unset !important; }
  .ng-star-inserted       { max-width: unset !important; }
`;

function applyStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);
}

function removeStyles() {
  const el = document.getElementById(STYLE_ID);
  if (el) el.remove();
}

function injectUI(enabled) {
  if (document.getElementById('gemini-pp-btn')) return;
  const container = document.querySelector('.buttons-container.adv-upsell');
  if (!container) return;

  if (!document.getElementById('gemini-pp-ui-styles')) {
    const style = document.createElement('style');
    style.id = 'gemini-pp-ui-styles';
    style.textContent = `
      #gemini-pp-btn { cursor: pointer; margin-right: 16px; }
      #gemini-pp-modal {
        position: fixed;
        z-index: 99999;
        min-width: 260px;
        background: var(--bard-color-surface-container-high, #303034);
        border-radius: 16px;
        padding: 16px 20px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.45);
      }
      #gemini-pp-modal .horizontal-container { flex-direction: column; }
      .gemini-pp-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      #gemini-pp-close {
        background: none; border: none;
        font-size: 20px; cursor: pointer;
        line-height: 1; padding: 0 2px;
        opacity: 0.5;
      }
      #gemini-pp-close:hover { opacity: 1; }
      .gemini-pp-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .gemini-pp-switch {
        position: relative;
        display: inline-block;
        width: 40px; height: 22px;
        flex-shrink: 0;
      }
      .gemini-pp-switch input { opacity: 0; width: 0; height: 0; }
      .gemini-pp-slider {
        position: absolute; inset: 0;
        background: #555;
        border-radius: 22px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .gemini-pp-slider::before {
        content: '';
        position: absolute;
        width: 16px; height: 16px;
        left: 3px; top: 3px;
        background: #999;
        border-radius: 50%;
        transition: transform 0.2s, background 0.2s;
      }
      .gemini-pp-switch input:checked + .gemini-pp-slider { background: #89b4fa; }
      .gemini-pp-switch input:checked + .gemini-pp-slider::before {
        transform: translateX(18px);
        background: #1e1e2e;
      }
    `;
    document.head.appendChild(style);
  }

  const btn = document.createElement('button');
  btn.id = 'gemini-pp-btn';
  btn.className = 'mdc-button mat-mdc-button-base mdc-button--unelevated mat-mdc-unelevated-button gds-button-tonal mat-unthemed';
  const logoUrl = chrome.runtime.getURL('assets/logo_no_bg.png');
  btn.innerHTML = `
    <span class="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
    <span class="mdc-button__label"><img src="${logoUrl}" alt="Gemini Horizon" style="width:20px;height:20px;vertical-align:middle;display:block;"></span>
    <span class="mat-focus-indicator"></span>
    <span class="mat-mdc-button-touch-target"></span>
  `;
  container.insertBefore(btn, container.firstChild);

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

  function showModal() {
    const rect = btn.getBoundingClientRect();
    modal.style.top = (rect.bottom + 8) + 'px';
    modal.style.right = (window.innerWidth - rect.right) + 'px';
    modal.style.display = 'block';
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (modal.style.display === 'none') showModal();
    else modal.style.display = 'none';
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
    if (isEnabled) applyStyles(); else removeStyles();
  });
}

function waitAndInject(enabled) {
  if (document.querySelector('.buttons-container.adv-upsell')) {
    injectUI(enabled);
    return;
  }
  const observer = new MutationObserver(() => {
    if (!document.getElementById('gemini-pp-btn') &&
        document.querySelector('.buttons-container.adv-upsell')) {
      injectUI(enabled);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

// Apply on load based on stored preference (default: enabled)
chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  if (enabled) applyStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitAndInject(enabled));
  } else {
    waitAndInject(enabled);
  }
});
