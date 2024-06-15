import axios from "axios";

// Define constants
const CHATGPT_END_POINT = "https://api.openai.com/v1/chat/completions";
const CHATGPT_MODEL = "gpt-4o";

/**
 * Compiles the prompt and input data into a message for the ChatGPT API.
 * @param {string} transcript The transcript to analyze.
 * @return {string} The compiled message.
 */
export const compileMessage = (transcript) => {
    return `Process and enhance a provided transcript, then extract and link points of interest to Google searches in an HTML format. Only respond with the final HTML paragraph, say nothing else.\n1. Clean Up Transcript: Read the provided transcript, correct any grammatical errors, and add necessary punctuation to ensure clarity and flow.\n2. Extract Points of Interest: Identify key phrases and points of interest such as names, technical terms, key logics and statements.\n3. Map Points to Keywords: Choose a keyword or phrase from the transcript for each identified point of interest.\n4. Generate HTML Response: Convert the cleaned transcript into HTML format and embed hyperlinks for each keyword that search for the point of interest on Google, ensuring links open in a new tab.\n---\n${transcript}`;
  };

/**
 * Function to send a message to the ChatGPT API and return the response.
 * @param {string} message The message to send to the API.
 * @param {string} openAIKey The API key for authentication.
 * @return {Promise<string|null>} The API response message or null if an error occurs.
 */
export const postChatGPTMessage = async (message, openAIKey) => {
  // Set headers for the axios request
  const config = {
    headers: {
      Authorization: `Bearer ${openAIKey}`,
    },
  };

  // Create the message object to send to the API
  const userMessage = { role: "user", content: message };

  // Define the data to send in the request body
  const chatGPTData = {
    model: CHATGPT_MODEL,
    messages: [userMessage],
  };

  try {
    // Send a POST request to the ChatGPT API
    const response = await axios.post(CHATGPT_END_POINT, chatGPTData, config);

    // Extract the message content from the API response
    const message = response?.data?.choices[0]?.message?.content;

    // Return the message content
    return message;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
        console.warn(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return postChatGPTMessage(message, openAIKey, retries - 1, delay * 2); // Exponential backoff
    } else {
        console.error("Error with ChatGPT API"); // Log error message
        console.error(error);

    // Return null if an error occurs
    return null;
  }
}
};
