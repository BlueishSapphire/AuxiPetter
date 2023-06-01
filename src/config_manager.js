const { timestamp } = require("./timestamp.js");

function load_config_reaction(emojis, emoji_name, chance, word, case_sensitive) {
	if (emoji_name === undefined) throw new Error(`[config.json] Error: emoji_name should be defined`);
	if (typeof(emoji_name) !== "string") throw new Error(`[config.json] Error: emoji_name should be a string`);
	if (emojis[emoji_name] === undefined) throw new Error(`[config.json] Error: could not find matching emoji entry for :${emoji_name}:`);
	if (chance === undefined) throw new Error(`[config.json] Error: chance should be defined`);
	if (typeof(chance) !== "number") throw new Error(`[config.json] Error: chance should be a number`);
	if (word === undefined) throw new Error(`[config.json] Error: word should be defined`);
	if (typeof(word) !== "string") throw new Error(`[config.json] Error: word should be a string`);
	if (typeof(case_sensitive) != "boolean") throw new Error(`[config.json] Error: case_sensitive should be a boolean`);

	let emoji_id = emojis[emoji_name];

	return { emoji_id, chance, word, case_sensitive };
}

function load_config_response(chance, word, message, case_sensitive) {
	if (chance === undefined) throw new Error(`[config.json] Error: chance should be defined`);
	if (typeof(chance) !== "number") throw new Error(`[config.json] Error: chance should be a number`);
	if (word === undefined) throw new Error(`[config.json] Error: word should be defined`);
	if (typeof(word) !== "string") throw new Error(`[config.json] Error: word should be a string`);
	if (message === undefined) throw new Error(`[config.json] Error: message should be defined`);
	if (typeof(message) !== "string") throw new Error(`[config.json] Error: message should be a string`);
	if (typeof(case_sensitive) != "boolean") throw new Error(`[config.json] Error: case_sensitive should be a boolean`);

	return { chance, word, message, case_sensitive };
}

function load_rule(emojis, target_id, reactions, responses) {
	if (target_id === undefined) {
		timestamp("[config.json] Error: target_id should be defined");
		target_id = "";
	}
	if (typeof(target_id) !== "string") {
		timestamp("[config.json] Error: target_id should be a string");
		target_id = "";
	}

	if (reactions === undefined) {
		timestamp("[config.json] Error: reactions should be defined");
		reactions = [];
	}
	if (typeof(reactions) !== "object") {
		timestamp("[config.json] Error: reactions should be an array");
		reactions = [];
	}

	if (responses === undefined) {
		timestamp("[config.json] Error: responses should be defined");
		responses = [];
	}
	if (typeof(responses) !== "object") {
		timestamp("[config.json] Error: responses should be an array");
		responses = [];
	}

	const reaction_results = [];
	for (const { emoji_name, chance, word, case_sensitive } of reactions) {
		try {
			reaction_results.push(load_config_reaction(emojis, emoji_name, chance, word, case_sensitive));
		} catch (error) {
			timestamp("[config.json]", error);
		}
	}

	const response_results = [];
	for (const { chance, word, message, case_sensitive } of responses) {
		try {
			response_results.push(load_config_response(chance, word, message, case_sensitive));
		} catch (error) {
			timestamp("[config.json]", error);
		}
	}

	return {
		target_id,
		reactions: reaction_results,
		responses: response_results,
	};
}

function load_default_rule({ reactions, responses }) {
	if (reactions === undefined) {
		timestamp("[config.json] Error: reactions should be defined");
		reactions = [];
	}
	if (typeof(reactions) !== "object") {
		timestamp("[config.json] Error: reactions should be an array");
		reactions = [];
	}

	if (responses === undefined) {
		timestamp("[config.json] Error: responses should be defined");
		responses = [];
	}
	if (typeof(responses) !== "object") {
		timestamp("[config.json] Error: responses should be an array");
		responses = [];
	}

	const reaction_results = [];
	for (const { emoji_name, chance, word, case_sensitive = false } of reactions) {
		try {
			reaction_results.push(load_config_reaction(emojis, emoji_name, chance, word, case_sensitive));
		} catch (error) {
			timestamp("[config.json]", error);
		}
	}

	const response_results = [];
	for (const { chance, word, message, case_sensitive = false } of responses) {
		try {
			response_results.push(load_config_response(chance, word, message, case_sensitive));
		} catch (error) {
			timestamp("[config.json]", error);
		}
	}

	return {
		reactions: reaction_results,
		responses: response_results,
	};
}

function reload_config() {
	timestamp("Loading config.json");

	const { emojis, rules, default_rule, chatgpt_system_prompt } = require("../config.json");

	if (emojis === undefined) {
		timestamp("[config.json] Error: emojis should be defined");
		emojis = [];
	}
	if (typeof(emojis) !== "object") {
		timestamp("[config.json] Error: emojis should be an array");
		emojis = [];
	}

	if (chatgpt_system_prompt === undefined) {
		timestamp("[config.json] Error: chatgpt_system_prompt should be defined");
		chatgpt_system_prompt = "";
	}
	if (typeof(chatgpt_system_prompt) !== "string") {
		timestamp("[config.json] Error: chatgpt_system_prompt should be a string");
		chatgpt_system_prompt = "";
	}

	global.config = {};

	global.config.rules = [];
	for (const { target_id, reactions, responses } of rules) {
		global.config.rules.push(load_rule(emojis, target_id, reactions, responses));
	}

	global.config.default_rule = load_default_rule(default_rule);
	global.config.chatgpt_system_prompt = chatgpt_system_prompt;
}

module.exports = { reload_config };