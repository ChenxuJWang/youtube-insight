/**
 * @fileoverview Provides functions to fetch and process YouTube video transcripts.
 */

let cachedTranscript = null;

/**
 * Fetches the transcript for a given YouTube video and filters it to a 20-second window around the current time.
 * @param {string} videoId The ID of the YouTube video.
 * @param {number} currentTime The current time of the video in seconds.
 * @return {Promise<string>} The formatted transcript around the current time.
 */
export const fetchTranscript = async (videoId, currentTime) => {
    try {
      const langOptions = await getLangOptionsWithLink(videoId);
      if (langOptions && langOptions.length > 0) {
        const transcript = await getTranscript(langOptions[0], currentTime);
        console.log("Transcript cached.");
        return transcript;
      }
      return "No transcript available.";
    } catch (error) {
      console.error("Error fetching transcript:", error);
      return "Error fetching transcript.";
    }
};

/**
 * Retrieves the formatted transcript for a given time from the cached data.
 * @param {number} currentTime The current time of the video in seconds.
 * @return {string|null} The formatted transcript around the current time, or null if no data is available.
 */
export const getCachedTranscript = (currentTime) => {
    if (!cachedTranscript) {
        return null;
    }

    if (!Array.isArray(cachedTranscript)) {
        console.error("Cached transcript is not an array:", cachedTranscript);
        return null;  // Ensure it's an array before proceeding
    }

    const windowStart = Math.max(0, currentTime - 10);
    const windowEnd = currentTime + 10;
    const relevantTranscript = cachedTranscript.filter(item => {
        const startTime = parseFloat(item.start);
        return startTime >= windowStart && startTime <= windowEnd;
    });

    if (relevantTranscript.length === 0) {
        return null;
    }

    const formattedTranscript = relevantTranscript.map((item) => item.text).join(' ');
    return formattedTranscript;
};

/**
 * Fetches language options and corresponding transcript links for a YouTube video.
 * @param {string} videoId The ID of the YouTube video.
 * @return {Promise<Array<{language: string, link: string}>>} The available language options with links.
 */
const getLangOptionsWithLink = async (videoId) => {
    const videoPageResponse = await fetch("https://www.youtube.com/watch?v=" + videoId);
    const videoPageHtml = await videoPageResponse.text();
    const splittedHtml = videoPageHtml.split('"captions":');

    if (splittedHtml.length < 2) { return; } // No Caption Available

    const captions_json = JSON.parse(splittedHtml[1].split(',"videoDetails')[0].replace('\n', ''));
    const captionTracks = captions_json.playerCaptionsTracklistRenderer.captionTracks;
    const languageOptions = Array.from(captionTracks).map(i => { return i.name.simpleText; });

    const first = "English"; // Sort by English first
    languageOptions.sort(function(x, y) { return x.includes(first) ? -1 : y.includes(first) ? 1 : 0; });
    languageOptions.sort(function(x, y) { return x == first ? -1 : y == first ? 1 : 0; });

    return Array.from(languageOptions).map((langName, index) => {
        const link = captionTracks.find(i => i.name.simpleText === langName).baseUrl;
        return {
        language: langName,
        link: link
        };
    });
};

/**
 * Fetches and formats the transcript for a given language option around the current time.
 * @param {Object} langOption The language option object containing the link.
 * @param {number} currentTime The current time of the video in seconds.
 * @return {Promise<string>} The formatted transcript.
 */
const getTranscript = async (langOption, currentTime) => {
    const rawTranscript = await getRawTranscript(langOption.link);
    cachedTranscript = rawTranscript;
    const relevantTranscript = rawTranscript.filter(item => {
        const startTime = parseFloat(item.start);
        // Ensure the start time is not less than 0 when adjusting for the current time
        const adjustedStartTime = Math.max(0, currentTime - 10);
        return startTime >= adjustedStartTime && startTime <= currentTime + 10;
    });
    
    const formattedTranscript = relevantTranscript.map((item) => {
        return item.text;
    }).join(' ');
    return formattedTranscript;
};

/**
 * Fetches the raw transcript data from the given link.
 * @param {string} link The URL to fetch the transcript from.
 * @return {Promise<Array<{start: string, duration: string, text: string}>>} The raw transcript data.
 */
const getRawTranscript = async (link) => {
    const transcriptPageResponse = await fetch(link); // default 0
    const transcriptPageXml = await transcriptPageResponse.text();

    const jQueryParse = $.parseHTML(transcriptPageXml);
    const textNodes = jQueryParse[1].childNodes;

    return Array.from(textNodes).map(i => {
        return {
        start: i.getAttribute("start"),
        duration: i.getAttribute("dur"),
        text: i.textContent
        };
    });
};

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