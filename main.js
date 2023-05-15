const fs = require("fs");
const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
require("dotenv").config();

function timestamp(message) {
	const date = new Date();
	const datestring = `[${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}]`;
	console.info(datestring, message);
}

function load_config_entry(emojis, emoji_name, chance, word, case_sensitive) {
	case_sensitive ??= false;

	if (typeof(emoji_name) !== "string") throw new Error(`[config.js] Error: emoji should be a string`);
	if (emojis[emoji_name] === undefined) throw new Error(`[config.js] Error: could not find matching emoji entry for :${emoji_name}:`);
	if (typeof(chance) !== "number") throw new Error(`[config.js] Error: chance should be a number`);
	if (typeof(word) !== "string") throw new Error(`[config.js] Error: word should be a string`);
	if (typeof(case_sensitive) != "boolean") throw new Error(`[config.js] Error: case_sensitive should be a boolean`);

	let emoji_id = emojis[emoji_name];

	return { emoji_id, chance, word, case_sensitive };
}

function reload_config() {
	console.info("Loading ./config.json");

	const { target_id, emojis, reactions } = require("./config.jsonc");

	if (target_id === undefined) {
		console.error("[config.js] Error: target_id should be defined");
		target_id = "";
	}
	if (typeof(target_id) !== "string") {
		console.error("[config.js] Error: target_id should be a string");
		target_id = "";
	}

	if (emojis === undefined) {
		console.error("[config.js] Error: emojis should be defined");
		emojis = [];
	}
	if (typeof(emojis) !== "object") {
		console.error("[config.js] Error: emojis should be an array");
		emojis = [];
	}

	const reaction_results = [];

	for (const { emoji_name, chance, word, case_sensitive } of Object.entries(reactions)) {
		try {
			reaction_results.append(load_config_entry(emojis, emoji_name, chance, word, case_sensitive));
		} catch (error) {
			console.error("[config.js]", error);
		}
	}

	global.config = {
		target_id,
		reactions: reaction_results
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

client.on(Events.MessageCreate, msg => {
	const { target_id, reactions } = global.config;

	if (msg.author.id !== target_id) return;

	for (const { word, chance, emoji_id, case_sensitive } of reactions) {
		if (chance <= 0) continue;

		if (case_sensitive) {
			if (msg.content.includes(word) && Math.random() < chance) {
				msg.react(emoji_id);
				timestamp(`Reacted to ${msg.author.username}`);
				return;
			}
		} else {
			if (msg.content.toLowerCase().includes(word.toLowerCase()) && Math.random() < chance) {
				msg.react(emoji_id);
				timestamp(`Reacted to ${msg.author.username}`);
				return;
			}
		}
	}

	// if (Math.random() < default_chance) {
	// 	msg.react(emoji_id);
	// 	timestamp(`Reacted to ${msg.author.username}`);
	// 	return;
	// }
});

client.login(process.env.TOKEN);
