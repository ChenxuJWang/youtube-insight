/**
 * @fileoverview Provides functions for displaying UI elements such as overlays.
 */


import { postChatGPTMessage, compileMessage } from './openai.js';

let existingOverlay = null;

/**
 * Removes the overlay if it exists.
 */
export const removeOverlay = () => {
    //const existingOverlay = document.getElementById('custom-overlay');
    if (existingOverlay) {
    existingOverlay.remove();
    console.log("Overlay removed.");
    existingOverlay = null;
    }
};

const appendOverlay = () => {
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
    overlay.style.padding = '16px';
    overlay.style.borderRadius = '10px';

    if (document.fullscreenElement) {
        // Fullscreen mode
        const playerContent = document.querySelector('.ytp-player-content.ytp-iv-player-content[data-layer="4"]');
        if (playerContent) {
            overlay.style.position = 'absolute';
            overlay.style.width = 'calc(100% - 120px)'; // Full width with 90px padding on both sides
            overlay.style.height = 'auto';
            overlay.style.zIndex = '10000';
            overlay.style.fontSize = '20px'; // Increase text size in fullscreen mode
            overlay.style.color = '#F4F3E7';
            overlay.style.bottom = '0';
            overlay.style.left = '0';
            overlay.style.background = 'linear-gradient(180deg, rgba(217, 217, 217, 0) 0%, rgba(21, 28, 19, 0.90) 100%)';
            overlay.style.padding = '60px';
            overlay.style.gap = '20px'; // Add gap between elements
            document.body.appendChild(overlay);
        }
    } else {
        // Window mode
        overlay.style.position = 'relative';
        overlay.style.width = 'calc(100% - 48px)';
        overlay.style.height = 'auto';
        overlay.style.top = '';
        overlay.style.left = '';
        overlay.style.zIndex = '';
        overlay.style.bottom = ''; // Reset bottom offset in window mode
        overlay.style.fontSize = '16px'; // Reset text size in window mode
        overlay.style.color = '#151C13'; // Reset text color in window modez
        overlay.style.padding = '24px';
        overlay.style.background = '#F4F3E7';
        overlay.style.gap = '10px'; // Add gap between elements

        const secondary = document.getElementById('secondary');
        if (secondary) {
            const secondaryInner = secondary.querySelector('#secondary-inner');
            if (secondaryInner) {
                secondaryInner.insertBefore(overlay, secondaryInner.firstChild);
            }
        }
    }
    existingOverlay = overlay;

    existingOverlay.appendChild(createCloseButton());
};

/**
 * Handler for fullscreen changes.
 */
const fullscreenChangeHandler = () => {
    // Ensure existingOverlay is still a valid DOM element and then assign properties
    if (existingOverlay) {
        const transcript = existingOverlay.querySelector('div[data-transcript]');
        const questionsDiv = existingOverlay.querySelector('div[data-questions]');
        removeOverlay();
        appendOverlay();
        if (document.fullscreenElement) {
            // Fullscreen mode
            questionsDiv.querySelectorAll('div[data-question]').forEach(div => {
                div.style.width = 'calc(33% - 64px)';
              });
        } else {
             // Window mode
             questionsDiv.querySelectorAll('div[data-question]').forEach(div => {
                div.style.width = 'calc(100% - 64px)';
              });
            // Remove loading animation class
            // existingOverlay.classList.remove('loading-border');
        }
        existingOverlay.appendChild(transcript);
    }
};

// Function to create and configure the close button
const createCloseButton = () => {
    const closeButton = document.createElement('button');
    console.log("Creating close button...");
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

    // Attaching the event listener to the close button
    closeButton.addEventListener('click', () => {
        removeOverlay();
        document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
        console.log("Event listener removed...");
    });

    return closeButton;
};

/**
 * Displays a loading overlay with the provided time and link information.
 * @param {string} timeString The formatted time string.
 * @param {string} linkString The video link string.
 */
export const displayLoadingOverlay = (timeString, linkString) => {
    // Remove existing overlay if it exists
    removeOverlay();
    
    // Initial append
    appendOverlay();
    console.log("Loading raw transcript...");
    // Display initial loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.innerText = 'Loading...';
    existingOverlay.appendChild(loadingMessage);
    existingOverlay.classList.add('loading-border'); // Add loading animation class

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
    //const existingOverlay = document.getElementById('custom-overlay');
    if (!existingOverlay) {
        console.error("Overlay not found for updating");
      return;
    }
    console.log("Updating existing overlay with transcript...");
    // Clear the loading message
    existingOverlay.innerText = '';

    const closeButton = createCloseButton();
    existingOverlay.appendChild(closeButton);


    // Display transcript when available
    const transcriptDiv = document.createElement('div');
    transcriptDiv.setAttribute('data-transcript', ''); 
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
            const responseObj = JSON.parse(chatGPTResponse);
            // Remove loading animation class
            existingOverlay.classList.remove('loading-border');
            transcriptDiv.remove();

            // Update the overlay with the processed transcript
            const processedTranscript = processTranscript(responseObj.transcript, responseObj.keywords);
            const pointsOfInterest = document.createElement('div');
            pointsOfInterest.setAttribute('data-transcript', ''); 
            pointsOfInterest.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and wrap text
            pointsOfInterest.style.overflowWrap = 'break-word'; // Break long words
            // pointsOfInterest.style.maxHeight = '150px'; // Set max height for the transcript area
            pointsOfInterest.style.overflowY = 'auto'; // Add vertical scrollbar if content overflows
            pointsOfInterest.innerHTML = `${processedTranscript}`;
            
            // Update hyperlink colors
            const links = pointsOfInterest.querySelectorAll('a');
            links.forEach(link => {
                link.style.color = '#F7944C';
                        });
            
            existingOverlay.appendChild(pointsOfInterest);

            // Display questions as clickable objects
            const questionsDiv = document.createElement('div');
            questionsDiv.innerHTML = '<h3>You may want to ask:</h3>';

            questionsDiv.setAttribute('data-questions', ''); // Mark for fullscreenChangeHandler
            questionsDiv.style.display = document.fullscreenElement ? 'flex' : 'block'; // Flex for fullscreen, block for window mode
            questionsDiv.style.flexWrap = 'wrap'; // Wrap questions in fullscreen mode
            questionsDiv.style.gap = '10px'; // Add gap between questions
            
            responseObj.questions.forEach(question => {
                const questionDiv = document.createElement('div');
                questionDiv.setAttribute('data-question', ''); // Mark for fullscreenChangeHandler
                questionDiv.style.cssText = `width: ${document.fullscreenElement ? 'calc(33% - 64px)' : 'calc(100% - 64px)'}; height: auto; padding: 6px 12px; background: #F6EED9; border-radius: 10px; display: inline-flex; justify-content: flex-start; align-items: flex-start; gap: 10px;`;
                questionDiv.innerHTML = `<div style="flex: 1 1 0; color: #BAB098; font-size: 16px; font-family: Roboto; font-weight: 400; word-wrap: break-word">${question}</div>`;
                questionDiv.addEventListener('click', () => {
                    console.log('Question clicked:', question);
                });
                questionsDiv.appendChild(questionDiv);
            });
            pointsOfInterest.appendChild(questionsDiv);

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
 * Processes the transcript by converting points of interest to Google search links.
 * @param {string} transcript The transcript text.
 * @param {object} keywords The keywords object containing points of interest.
 * @returns {string} The processed transcript with embedded Google search links.
 */
const processTranscript = (transcript, keywords) => {
    if (typeof transcript !== 'string') {
        console.error('Transcript is not a string:', transcript);
        return '';
      }

    let processedTranscript = transcript;
    for (const [key, value] of Object.entries(keywords)) {
        if (typeof value.text !== 'string') {
            console.error('Keyword text is not a string:', value.text);
            continue;
          }
      const searchLink = `<a href="https://www.google.com/search?q=${encodeURIComponent(value.point_of_interest)}" target="_blank">${value.text}</a>`;
      try {
        processedTranscript = processedTranscript.replace(new RegExp(value.text, 'g'), searchLink);
      } catch (error) {
        console.error('Error replacing text:', value.text, error);
      }
    }
    return processedTranscript;
  };

// Updating the handler to attach to a specific element or conditionally apply based on page structure
document.addEventListener('fullscreenchange', fullscreenChangeHandler);

// Add CSS for loading animation
const loadingStyle = document.createElement('style');
loadingStyle.innerHTML = `
    .loading-border {
        border: 4px solid transparent;
        border-radius: 10px;
        border-image: linear-gradient(to right, #F7944C, #F4F3E7, #F7944C) 1;
        border-image-slice: 1;
        animation: border-animation 2s linear infinite;
    }

    @keyframes border-animation {
        0% {
            border-image-source: linear-gradient(to right, #F7944C, #F4F3E7, #F7944C);
        }
        100% {
            border-image-source: linear-gradient(to right, #F4F3E7, #F7944C, #F4F3E7);
        }
    }
`;
document.head.appendChild(loadingStyle);