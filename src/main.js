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
	// === User specific rules ===

	for (const { target_id, reactions, responses } of global.config.rules) {
		if (msg.author.id !== target_id) continue;

		// === Reactions ===
		
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
	
		// === Responses ===

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

	// === Default Reactions ===

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

	// === Default Responses ===

	for (const { word, chance, message, case_sensitive } of global.config.default_rule.responses) {
		if (chance <= 0 || Math.random() > chance) continue;

		const content = case_sensitive ? msg.content : msg.content.toLowerCase();

		if (content.includes(case_sensitive ? word : word.toLowerCase())) {
			msg.channel.sendTyping();
			try {
				await msg.reply(message);
				timestamp(`Responded to ${msg.author.username}`);
			} catch (error) { }
		}
	}

	// === Language cortex ===

	if (global.config.chatgpt.enabled) {
		const ping_str = `<@${client.user.id}>`;
		if (msg.content.startsWith(ping_str)) {
			timestamp(`Sent GPT response to ${msg.author.username}`);
			msg.channel.sendTyping();
			if (msg.content.length > 700) {
				await msg.reply("sorry, I'm not reading all that :3");
			} else {
				await msg.reply(await gptResponse(
					global.config.chatgpt.system_prompt.replace("{}", msg.author.username),
					global.config.chatgpt.assistant_prompt.replace("{}", msg.author.username),
					msg.content.slice(ping_str.length).trim()
				));
			}
		}
	}
});

client.login(process.env.DISCORD_TOKEN);
