const fs = require("fs");
const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
require("dotenv").config();

function pad_zeroes(number, length) {
	return number.toString().padStart(length, "0");
}

function timestamp(message) {
	const date = new Date();

	const year = pad_zeroes(date.getFullYear(), 2);
	const month = pad_zeroes(date.getMonth(), 2);
	const day = pad_zeroes(date.getDate(), 2);

	const hour = pad_zeroes(date.getHours(), 2);
	const minute = pad_zeroes(date.getMinutes(), 2);
	const second = pad_zeroes(date.getSeconds(), 2);

	const datestring = `[${year}-${month}-${day} ${hour}:${minute}:${second}]`;
	console.info(datestring, message);
}

function load_config_reaction(emojis, emoji_name, chance, word, case_sensitive) {
	case_sensitive ??= false;

	if (emoji_name === undefined) throw new Error(`[config.js] Error: emoji_name should be defined`);
	if (typeof(emoji_name) !== "string") throw new Error(`[config.js] Error: emoji_name should be a string`);
	if (emojis[emoji_name] === undefined) throw new Error(`[config.js] Error: could not find matching emoji entry for :${emoji_name}:`);
	if (chance === undefined) throw new Error(`[config.js] Error: chance should be defined`);
	if (typeof(chance) !== "number") throw new Error(`[config.js] Error: chance should be a number`);
	if (word === undefined) throw new Error(`[config.js] Error: word should be defined`);
	if (typeof(word) !== "string") throw new Error(`[config.js] Error: word should be a string`);
	if (typeof(case_sensitive) != "boolean") throw new Error(`[config.js] Error: case_sensitive should be a boolean`);

	let emoji_id = emojis[emoji_name];

	return { emoji_id, chance, word, case_sensitive };
}

function load_config_response(chance, word, message, case_sensitive) {
	case_sensitive ??= false;

	if (chance === undefined) throw new Error(`[config.js] Error: chance should be defined`);
	if (typeof(chance) !== "number") throw new Error(`[config.js] Error: chance should be a number`);
	if (word === undefined) throw new Error(`[config.js] Error: word should be defined`);
	if (typeof(word) !== "string") throw new Error(`[config.js] Error: word should be a string`);
	if (message === undefined) throw new Error(`[config.js] Error: message should be defined`);
	if (typeof(message) !== "string") throw new Error(`[config.js] Error: message should be a string`);
	if (typeof(case_sensitive) != "boolean") throw new Error(`[config.js] Error: case_sensitive should be a boolean`);

	return { chance, word, message, case_sensitive };
}

function reload_config() {
	timestamp("Loading ./config.json");

	const { target_id, emojis, reactions, responses } = require("./config.json");

	if (target_id === undefined) {
		timestamp("[config.js] Error: target_id should be defined");
		target_id = "";
	}
	if (typeof(target_id) !== "string") {
		timestamp("[config.js] Error: target_id should be a string");
		target_id = "";
	}

	if (emojis === undefined) {
		timestamp("[config.js] Error: emojis should be defined");
		emojis = [];
	}
	if (typeof(emojis) !== "object") {
		timestamp("[config.js] Error: emojis should be an array");
		emojis = [];
	}

	if (reactions === undefined) {
		timestamp("[config.js] Error: reactions should be defined");
		emojis = [];
	}
	if (typeof(reactions) !== "object") {
		timestamp("[config.js] Error: reactions should be an array");
		emojis = [];
	}

	if (responses === undefined) {
		timestamp("[config.js] Error: responses should be defined");
		emojis = [];
	}
	if (typeof(responses) !== "object") {
		timestamp("[config.js] Error: responses should be an array");
		emojis = [];
	}

	const reaction_results = [];

	for (const { emoji_name, chance, word, case_sensitive } of reactions) {
		try {
			reaction_results.push(load_config_reaction(emojis, emoji_name, chance, word, case_sensitive));
		} catch (error) {
			timestamp("[config.js]", error);
		}
	}

	const response_results = [];

	for (const { chance, word, message, case_sensitive } of responses) {
		try {
			response_results.push(load_config_response(chance, word, message, case_sensitive));
		} catch (error) {
			timestamp("[config.js]", error);
		}
	}

	global.config = {
		target_id,
		reactions: reaction_results,
		responses: response_results,
	};
}

fs.watchFile("./config.json", reload_config);
reload_config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: [
		Partials.User,
		Partials.Channel,
		Partials.GuildMember,
		Partials.Message,
	]
});

client.once(Events.ClientReady, c => {
	timestamp(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async msg => {
	const { target_id, reactions } = global.config;

	if (msg.author.id !== target_id) return;

	for (const { word, chance, emoji_id, case_sensitive } of reactions) {
		if (chance <= 0) continue;

		if (case_sensitive) {
			if (msg.content.includes(word) && Math.random() < chance) {
				try {
					await msg.react(emoji_id);
					timestamp(`Reacted to ${msg.author.username}`);
				} catch (error) {}
			}
		} else {
			if (msg.content.toLowerCase().includes(word.toLowerCase()) && Math.random() < chance) {
				try {
					await msg.react(emoji_id);
					timestamp(`Reacted to ${msg.author.username}`);
				} catch (error) {}
			}
		}
	}

	for (const { word, chance, message, case_sensitive } of responses) {
		if (chance <= 0) continue;

		if (case_sensitive) {
			if (msg.content.includes(word) && Math.random() < chance) {
				await msg.reply(message);
				timestamp(`Responded to ${msg.author.username}`);
				return;
			}
		} else {
			if (msg.content.toLowerCase().includes(word.toLowerCase()) && Math.random() < chance) {
				await msg.reply(message);
				timestamp(`Responded to ${msg.author.username}`);
				return;
			}
		}
	}
});

client.login(process.env.TOKEN);
