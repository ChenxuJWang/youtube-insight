/**
 * @fileoverview Provides functions for displaying UI elements such as overlays.
 */


import { postChatGPTMessage, compileMessage } from './openai.js';
/**
 * Displays a loading overlay with the provided time and link information.
 * @param {string} timeString The formatted time string.
 * @param {string} linkString The video link string.
 */
export const displayLoadingOverlay = (timeString, linkString) => {
    // Remove existing overlay if it exists
    removeOverlay();


    const overlay = document.createElement('div');
    overlay.id = 'custom-overlay';
    overlay.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, 0) 22%, #F4F3E7 100%)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.color = '#151C13';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.fontSize = '16px';
    overlay.style.padding = '10px';
    overlay.style.borderRadius = '10px';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.backgroundColor = '#F7944C';
    closeButton.style.color = '#FFFFFF';
    closeButton.style.border = 'none';
    closeButton.style.padding = '5px 10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.borderRadius = '5px';

    closeButton.addEventListener('click', () => {
        if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        }
        document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    });
    
    overlay.appendChild(closeButton);

    const appendOverlay = () => {
    if (document.fullscreenElement) {
        // Fullscreen mode
        const chromeBottom = document.querySelector('.ytp-chrome-bottom');
        if (chromeBottom) {
            overlay.style.position = 'absolute';
            overlay.style.width = '90%';
            overlay.style.height = '20%';
            overlay.style.zIndex = '10000';
            overlay.style.fontSize = '20px'; // Increase text size in fullscreen mode
            overlay.style.left = chromeBottom.style.left;
            overlay.style.bottom = `calc(${chromeBottom.offsetHeight}px + 20px)`;
            document.body.appendChild(overlay);
        }
    } else {
        // Window mode
        overlay.style.position = 'relative';
        overlay.style.width = '100%';
        overlay.style.height = 'auto';
        overlay.style.top = '';
        overlay.style.left = '';
        overlay.style.zIndex = '';
        overlay.style.bottom = ''; // Reset bottom offset in window mode
        overlay.style.fontSize = '16px'; // Reset text size in window mode

        const secondary = document.getElementById('secondary');
        if (secondary) {
        const secondaryInner = secondary.querySelector('#secondary-inner');
        if (secondaryInner) {
            secondaryInner.insertBefore(overlay, secondaryInner.firstChild);
        }
        }
    }
    };
    
    // Initial append
    appendOverlay();

    // Display initial loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.innerText = 'Loading...';
    overlay.appendChild(loadingMessage);

    // Define fullscreenChangeHandler
    const fullscreenChangeHandler = () => {
        if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        }
        appendOverlay();
    };

    // Event listener for fullscreen change
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
};

/**
 * Displays an overlay with the provided time, link, and transcript information.
 * @param {string} timeString The formatted time string.
 * @param {string} linkString The video link string.
 * @param {string} transcript The transcript text.
 */
export const updateOverlayWithTranscript = (timeString, linkString, transcript) => {
    const existingOverlay = document.getElementById('custom-overlay');
    if (!existingOverlay) {
        console.error("Overlay not found for updating");
      return;
    }
    console.log("Updating existing overlay with transcript...");
    // Clear the loading message
    existingOverlay.innerText = '';

    // Add the close button again
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.backgroundColor = '#F7944C';
    closeButton.style.color = '#FFFFFF';
    closeButton.style.border = 'none';
    closeButton.style.padding = '5px 10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.borderRadius = '5px';

    closeButton.addEventListener('click', () => {
        if (existingOverlay.parentNode) {
        existingOverlay.parentNode.removeChild(existingOverlay);
        }
        document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    });

    existingOverlay.appendChild(closeButton);

    // Display transcript when available
    const transcriptDiv = document.createElement('div');
    transcriptDiv.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and wrap text
    transcriptDiv.style.overflowWrap = 'break-word'; // Break long words
    transcriptDiv.style.maxHeight = '150px'; // Set max height for the transcript area
    transcriptDiv.style.overflowY = 'auto'; // Add vertical scrollbar if content overflows
    transcriptDiv.innerHTML = `${transcript}`;
    existingOverlay.appendChild(transcriptDiv);
    console.log("Transcript added to overlay");
 
    // Fetch OpenAI API key from storage
    chrome.storage.sync.get(['openAIKey'], async (result) => {
        const openAIKey = result.openAIKey;
        if (openAIKey) {
        // Compile the message
        const message = compileMessage(transcript);
        // Post transcript to OpenAI and fetch response
        const chatGPTResponse = await postChatGPTMessage(message, openAIKey);
        if (chatGPTResponse) {
            console.log("Points of interest fetched from OpenAI");
            transcriptDiv.innerHTML = ``;

            // Display points of interest
            const pointsOfInterest = document.createElement('div');
            pointsOfInterest.style.marginTop = '10px';
            pointsOfInterest.style.color = '#151C13';
            pointsOfInterest.innerHTML = chatGPTResponse;  // Directly set the innerHTML to the response HTML
            existingOverlay.appendChild(pointsOfInterest);

            // Update hyperlink colors
            const links = existingOverlay.querySelectorAll('a');
            links.forEach(link => {
                link.style.color = '#F7944C';
            });
        } else {
            const errorMessage = document.createElement('div');
            errorMessage.style.marginTop = '10px';
            errorMessage.style.color = 'red';
            errorMessage.innerText = 'Error: Unable to fetch points of interest from OpenAI.';
            existingOverlay.appendChild(errorMessage);
          }
        } else {
        const errorMessage = document.createElement('div');
        errorMessage.style.marginTop = '10px';
        errorMessage.style.color = 'red';
        errorMessage.innerText = 'Error: OpenAI API Key not found.';
        existingOverlay.appendChild(errorMessage);
        }
    });
  };

/**
 * Removes the overlay if it exists.
 */
    export const removeOverlay = () => {
    const existingOverlay = document.getElementById('custom-overlay');
    if (existingOverlay) {
    existingOverlay.remove();
    }
};