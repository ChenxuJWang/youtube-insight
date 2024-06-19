/**
 * @fileoverview Content script for injecting controls into YouTube video player.
 * This script adds a pause button to the video player and fetches the transcript.
 */

import { displayLoadingOverlay, updateOverlayWithTranscript, removeOverlay } from './ui.js';
import { fetchTranscript, getCachedTranscript } from './transcript.js';

let videoId = null;

(() => {
  let youtubeLeftControls, youtubePlayer;
  let currentVideo = "";

    /**
   * Formats time in seconds to HH:MM:SS format.
   * @param {number} t Time in seconds.
   * @return {string} Formatted time string.
   */
  const getTime = t => {
    var date = new Date(0);
    date.setSeconds(t);
  
    return date.toISOString().substr(11, 8);
  };
  
    /**
   * Event handler for pause button click.
   * Pauses the video, logs current time and video link, and displays transcript.
   */
  const addPauseButtonEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const videoLink = window.location.href;
    const timeString = `Paused at: ${getTime(currentTime)}`;
    const linkString = `Video link: ${videoLink}`;
    videoId = new URLSearchParams(new URL(videoLink).search).get("v");
    
    youtubePlayer.pause();

    // Display the overlay immediately with a loading message
    displayLoadingOverlay(timeString, linkString);
    
    const transcript = getCachedTranscript(currentTime) || await fetchTranscript(videoId, currentTime);
    console.log("Transcript:", transcript);
    
    updateOverlayWithTranscript(timeString, linkString, transcript);
  };
  
  /**
   * Initializes the video player by adding a pause button if it doesn't already exist.
   */
  const newVideoLoaded = () => {
    const pauseBtnExists = document.getElementsByClassName("pause-btn")[0];

    if (!pauseBtnExists) {
      const pauseBtn = document.createElement("img");

      pauseBtn.src = chrome.runtime.getURL("assets/pause.png");
      pauseBtn.className = "ytp-button pause-btn";
      pauseBtn.title = "Click to pause video and log timestamp";

      youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
      youtubePlayer = document.getElementsByClassName('video-stream')[0];

      youtubeLeftControls.appendChild(pauseBtn);
      pauseBtn.addEventListener("click", addPauseButtonEventHandler);
    }
  };

  // Monitor for URL changes to remove overlay and fetch transcript when playing a new video
  const observer = new MutationObserver(() => {
    const videoLink = window.location.href;
    const newVideoId = new URLSearchParams(new URL(videoLink).search).get("v");

    if (videoId !== newVideoId) {
      removeOverlay();
      const initTime = youtubePlayer.currentTime;
      fetchTranscript(videoId, initTime);
    }
  });

observer.observe(document.body, { childList: true, subtree: true });
  
  // Listen for messages from the background script.
  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, videoId } = obj;

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    }
  });
  
  // Initialize the script when a new video is loaded.
  newVideoLoaded();
})();

