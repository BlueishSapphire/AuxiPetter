require("dotenv").config();
const fs = require("fs");
const { Client, Events, GatewayIntentBits, Partials, DMChannel } = require('discord.js');

const { timestamp } = require("./timestamp.js");
const { reload_config } = require("./config_manager.js");
const { gptResponse } = require("./soul.js");

fs.watchFile("../config.json", reload_config);
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
	for (const { target_id, reactions, responses } of global.config.rules) {
		if (msg.author.id !== target_id) continue;

		for (const { emoji_id, chance, word, case_sensitive } of reactions) {
			if (chance <= 0 || Math.random() > chance) continue;

			const content = case_sensitive ? msg.content : msg.content.toLowerCase();
	
			if (content.includes(case_sensitive ? word : word.toLowerCase())) {
				try {
					await msg.react(emoji_id);
					timestamp(`Reacted to ${msg.author.username}`);
				} catch (error) { }
			}
		}
	
		for (const { word, chance, message, case_sensitive } of responses) {
			if (chance <= 0 || Math.random() > chance) continue;
	
			const content = case_sensitive ? msg.content : msg.content.toLowerCase();
	
			if (content.includes(case_sensitive ? word : word.toLowerCase())) {
				try {
					await msg.reply(message);
					timestamp(`Responded to ${msg.author.username}`);
				} catch (error) { }
			}
		}
	}

	for (const { word, chance, emoji_id, case_sensitive } of global.config.default_rule.reactions) {
		if (chance <= 0 || Math.random() > chance) continue;

		const content = case_sensitive ? msg.content : msg.content.toLowerCase();

		if (content.includes(case_sensitive ? word : word.toLowerCase())) {
			try {
				await msg.react(emoji_id);
				timestamp(`Reacted to ${msg.author.username}`);
			} catch (error) { }
		}
	}

	for (const { word, chance, message, case_sensitive } of global.config.default_rule.responses) {
		if (chance <= 0 || Math.random() > chance) continue;

		const content = case_sensitive ? msg.content : msg.content.toLowerCase();

		if (content.includes(case_sensitive ? word : word.toLowerCase())) {
			try {
				await msg.reply(message);
				timestamp(`Responded to ${msg.author.username}`);
			} catch (error) { }
		}
	}

	const ping_str = `<@!${client.user.id}>`;
	if (msg.content.startsWith(ping_str)) {
		if (msg.content.length > 700) {
			await msg.reply("sorry, I'm not reading all that");
		} else {
			await msg.reply(gptResponse(global.config.chatgpt_system_prompt, msg.content.slice(ping_str.length)));
		}
	}
});

client.login(process.env.DISCORD_TOKEN);
