const { timestamp } = require("./timestamp.js");

function load_config_reaction(emojis, emoji_name, chance, word, case_sensitive = false) {
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

function load_config_response(chance, word, message, case_sensitive = false) {
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
			timestamp("[config.json]" + error);
		}
	}

	const response_results = [];
	for (const { chance, word, message, case_sensitive } of responses) {
		try {
			response_results.push(load_config_response(chance, word, message, case_sensitive));
		} catch (error) {
			timestamp("[config.json]" + error);
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
			timestamp("[config.json]" + error);
		}
	}

	const response_results = [];
	for (const { chance, word, message, case_sensitive = false } of responses) {
		try {
			response_results.push(load_config_response(chance, word, message, case_sensitive));
		} catch (error) {
			timestamp("[config.json]" + error);
		}
	}

	return {
		reactions: reaction_results,
		responses: response_results,
	};
}

function load_chatgpt({ enabled, system_prompt, assistant_prompt }) {
	if (enabled === undefined) {
		timestamp("[config.json] Error: enabled should be defined");
		enabled = false;
	}
	if (typeof(enabled) !== "boolean") {
		timestamp("[config.json] Error: enabled should be a boolean");
		enabled = false;
	}

	if (system_prompt === undefined) {
		timestamp("[config.json] Error: system_prompt should be defined");
		system_prompt = "";
	}
	if (typeof(system_prompt) !== "string") {
		timestamp("[config.json] Error: system_prompt should be a string");
		system_prompt = "";
	}

	if (assistant_prompt === undefined) {
		timestamp("[config.json] Error: assistant_prompt should be defined");
		assistant_prompt = "";
	}
	if (typeof(assistant_prompt) !== "string") {
		timestamp("[config.json] Error: assistant_prompt should be a string");
		assistant_prompt = "";
	}

	return {
		enabled,
		system_prompt,
		assistant_prompt,
	};
}

function reload_config() {
	timestamp("Loading config.json");

	const { emojis, rules, default_rule, chatgpt } = require("../config.json");

	if (emojis === undefined) {
		timestamp("[config.json] Error: emojis should be defined");
		emojis = [];
	}
	if (typeof(emojis) !== "object") {
		timestamp("[config.json] Error: emojis should be an array");
		emojis = [];
	}

	global.config = {};

	global.config.rules = [];
	for (const { target_id, reactions, responses } of rules) {
		global.config.rules.push(load_rule(emojis, target_id, reactions, responses));
	}

	global.config.default_rule = load_default_rule(default_rule);
	global.config.chatgpt = load_chatgpt(chatgpt);
}

module.exports = { reload_config };