const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

const configuration = new Configuration({
	apiKey: process.env.OPENAI_TOKEN,
});
const openai = new OpenAIApi(configuration);

async function gptResponse(system_prompt, assistant_prompt, prompt) {
	try {
		const completion = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: [
				{ "role": "system",    "content": system_prompt },
				{ "role": "assistant", "content": assistant_prompt },
				{ "role": "user",      "content": prompt },
			]
		});

		return completion.data.choices[0].message.content;
	} catch (error) {
		console.error(error.response.data.error);
	}
}

module.exports = { gptResponse };