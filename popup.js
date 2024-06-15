document.getElementById('saveButton').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    if (apiKey) {
      chrome.storage.sync.set({ openAIKey: apiKey }, () => {
        alert('API Key saved successfully.');
      });
    } else {
      alert('Please enter a valid API key.');
    }
  });
  