
describe('background.js', () => {
  let onClickedListener;

  beforeEach(() => {
    jest.resetModules();
    onClickedListener = null;

    global.chrome = {
      action: {
        onClicked: {
          addListener: jest.fn((callback) => {
            onClickedListener = callback;
          }),
        },
      },
      tabs: {
        query: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      windows: {
        update: jest.fn(),
      },
    };

    require('../src/background');
  });

  test('should add a listener to chrome.action.onClicked', () => {
    expect(chrome.action.onClicked.addListener).toHaveBeenCalled();
    expect(onClickedListener).toBeDefined();
  });

  test('should focus existing Gemini tab if found', async () => {
    const mockTabs = [
      { id: 1, windowId: 10, lastAccessed: 100 },
      { id: 2, windowId: 10, lastAccessed: 200 },
    ];
    chrome.tabs.query.mockResolvedValue(mockTabs);

    await onClickedListener();

    expect(chrome.tabs.query).toHaveBeenCalledWith({ url: 'https://gemini.google.com/*' });
    expect(chrome.tabs.update).toHaveBeenCalledWith(2, { active: true });
    expect(chrome.windows.update).toHaveBeenCalledWith(10, { focused: true });
  });

  test('should handle all permutations of lastAccessed when sorting tabs', async () => {
    // Case: both missing
    chrome.tabs.query.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    await onClickedListener();
    
    // Case: first missing, second exists
    chrome.tabs.query.mockResolvedValue([{ id: 1 }, { id: 2, lastAccessed: 100 }]);
    await onClickedListener();
    expect(chrome.tabs.update).toHaveBeenCalledWith(2, { active: true });

    // Case: first exists, second missing
    chrome.tabs.query.mockResolvedValue([{ id: 1, lastAccessed: 100 }, { id: 2 }]);
    await onClickedListener();
    expect(chrome.tabs.update).toHaveBeenCalledWith(1, { active: true });
  });

  test('should create new Gemini tab if none exists', async () => {
    chrome.tabs.query.mockResolvedValue([]);

    await onClickedListener();

    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://gemini.google.com/' });
  });
});
