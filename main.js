const fs = require("fs");
const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
const { timestamp } = require("./timestamp.js");
const { reload_config } = require("./config_manager.js");

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

		const content = case_sensitive ? msg.content : msg.content.toLowerCase();

		if (content.includes(case_sensitive ? word : word.toLowerCase()) && Math.random() < chance) {
			try {
				await msg.react(emoji_id);
				timestamp(`Reacted to ${msg.author.username}`);
			} catch (error) {}
		}
	}

	for (const { word, chance, message, case_sensitive } of responses) {
		if (chance <= 0) continue;

		const content = case_sensitive ? msg.content : msg.content.toLowerCase();

		if (content.includes(case_sensitive ? word : word.toLowerCase()) && Math.random() < chance) {
			try {
				await msg.reply(message);
				timestamp(`Responded to ${msg.author.username}`);
			} catch (error) {}
		}
	}
});

client.login(process.env.TOKEN);
