/**
 * @fileoverview Background script for handling tab updates and sending messages to content scripts.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('youtube.com/watch')) {
    const queryParameters = tab.url.split('?')[1];
    const urlParameters = new URLSearchParams(queryParameters);

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      videoId: urlParameters.get('v'),
    });
  }
});
