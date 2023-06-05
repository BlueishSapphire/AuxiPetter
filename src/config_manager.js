const fs = require("fs");
const { timestamp } = require("./timestamp.js");



function config_error(msg) {
	timestamp(`[config.json] Error: ${msg}`);
}

function assert_msg(val, msg) {
	if (val === undefined) throw new Error(msg);
}

function _assert_type(obj, type) {
	assert_defined(obj);
	if (typeof(Object.values(obj)[0]) !== type) {
		throw new Error(`${Object.keys(obj)[0]} should be a ${type}`);
	}
}

function assert_defined(obj) {
	if (Object.values(obj)[0] === undefined) {
		throw new Error(`${Object.keys(obj)[0]} should be defined`);
	}
}

function assert_string(obj) {
	_assert_type(obj, "string");
}

function assert_array(obj) {
	_assert_type(obj, "object");
}

function assert_number(obj) {
	_assert_type(obj, "number");
}

function assert_boolean(obj) {
	_assert_type(obj, "boolean");
}

function assert_default(assert_func, obj, default_value) {
	try {
		assert_func(obj);
		return Object.values(obj)[0];
	} catch (error) {
		config_error(error);
		return default_value;
	}
}



function load_config_reaction(emojis, emoji_name, chance, word, case_sensitive = false) {
	assert_string({emoji_name});
	assert_number({chance});
	assert_string({word});
	assert_boolean({case_sensitive});

	assert_msg(emojis[emoji_name], `Could not find matching emoji entry for :${emoji_name}:`);

	let emoji_id = emojis[emoji_name];

	return { emoji_id, chance, word, case_sensitive };
}

function load_config_response(chance, word, message, case_sensitive = false) {
	assert_number({chance});
	assert_string({word});
	assert_string({message});
	assert_boolean({case_sensitive});

	return { chance, word, message, case_sensitive };
}

function load_rule(emojis, target_id, reactions, responses) {
	assert_string({target_id});
	assert_array({reactions});
	assert_array({responses});

	const reaction_results = [];
	for (const { emoji_name, chance, word, case_sensitive } of reactions) {
		try {
			reaction_results.push(load_config_reaction(emojis, emoji_name, chance, word, case_sensitive));
		} catch (error) {
			config_error(error);
		}
	}

	const response_results = [];
	for (const { chance, word, message, case_sensitive } of responses) {
		try {
			response_results.push(load_config_response(chance, word, message, case_sensitive));
		} catch (error) {
			config_error(error);
		}
	}

	return {
		target_id,
		reactions: reaction_results,
		responses: response_results,
	};
}

function load_default_rule({ reactions, responses }) {
	reactions = assert_default(assert_array, { reactions }, []);
	responses = assert_default(assert_array, { responses }, []);

	const reaction_results = [];
	for (const { emoji_name, chance, word, case_sensitive = false } of reactions) {
		try {
			reaction_results.push(load_config_reaction(emojis, emoji_name, chance, word, case_sensitive));
		} catch (error) {
			config_error(error);
		}
	}

	const response_results = [];
	for (const { chance, word, message, case_sensitive = false } of responses) {
		try {
			response_results.push(load_config_response(chance, word, message, case_sensitive));
		} catch (error) {
			config_error(error);
		}
	}

	return {
		reactions: reaction_results,
		responses: response_results,
	};
}

function load_chatgpt({ enabled, system_prompt, assistant_prompt }) {
	enabled = assert_default(assert_boolean, { enabled }, false);
	system_prompt = assert_default(assert_string, { system_prompt }, "");
	assistant_prompt = assert_default(assert_string, { assistant_prompt }, "");

	return {
		enabled,
		system_prompt,
		assistant_prompt,
	};
}

function load_config_file(path) {
	try {
		let config = JSON.parse(fs.readFileSync(path));
		config._success = true;
		return config;
	} catch (error) {
		config_error(error);
		return { _success: false };
	}
}

function reload_config() {
	timestamp("Loading config.json");

	let { _success, emojis, rules, default_rule, chatgpt } = load_config_file("./config.json");
	if (!_success) return;

	emojis = assert_default(assert_array, { emojis }, []);

	global.config = {};

	global.config.rules = [];
	for (const { target_id, reactions, responses } of rules) {
		global.config.rules.push(load_rule(emojis, target_id, reactions, responses));
	}

	global.config.default_rule = load_default_rule(default_rule);
	global.config.chatgpt = load_chatgpt(chatgpt);
}

module.exports = { reload_config };