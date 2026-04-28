chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: 'https://gemini.google.com/*' });

  if (tabs.length > 0) {
    // Switch to the most recently accessed Gemini tab
    const sorted = tabs.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
    const target = sorted[0];
    await chrome.tabs.update(target.id, { active: true });
    await chrome.windows.update(target.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url: 'https://gemini.google.com/' });
  }
});
