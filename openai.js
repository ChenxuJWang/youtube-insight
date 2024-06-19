import axios from "axios";

// Define constants
const CHATGPT_END_POINT = "https://api.openai.com/v1/chat/completions";
const CHATGPT_MODEL = "gpt-3.5-turbo";

/**
 * Compiles the prompt and input data into a message for the ChatGPT API.
 * @param {string} transcript The transcript to analyze.
 * @return {string} The compiled message.
 */
export const compileMessage = (transcript) => {
  return `Process and enhance a provided transcript, then extract points of interest and generate follow-up questions. 
1. Clean Up Transcript: Read the provided transcript, correct any grammatical errors, and add necessary punctuation to ensure clarity and flow.
2. Extract Points of Interest: Identify key phrases and points of interest such as names, technical terms, key logics and statements.
3. Questions you may ask: Generate several follow up questions based on the transcript's content
4. Map Points to Keywords: Choose a keyword or phrase from the transcript for each identified point of interest.
5. Generate Response: Compile the cleaned transcript, keywords pair, and questions to a JSON response
---
${transcript}`;
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
  const systemMessage = { role: "system", content:`Provide output in valid JSON. The data schema should be like this: { \"transcript\": {transcript string}, \"keywords\": { \"\": { \"text\": {}, \"point_of_interest\": {} } }, \"questions\": [] }`};
  const userMessage = { role: "user", content: message };

  // Define the data to send in the request body
  const chatGPTData = {
    model: CHATGPT_MODEL,
    messages: [systemMessage, userMessage],
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
