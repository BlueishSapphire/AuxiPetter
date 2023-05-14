const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
require("dotenv").config();

function timestamp(message) {
	const date = new Date();
	const datestring = `[${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}]`;
	console.log(datestring, message);
}

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
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, msg => {
	const { target_id, emoji_id, chances, default_chance } = require("./config.jsonc");

	if (msg.author.id !== target_id) return;

	for (const { word, chance, case_sensitive } of chances) {
		chance = chance ?? 1.0;

		if (chance <= 0) continue;

		if (case_sensitive ?? false) {
			if (msg.content.includes(word) && Math.random() < chance) {
				msg.react(emoji_id);
				timestamp(`Patted ${msg.author.username}`);
				return;
			}
		} else {
			if (msg.content.toLowerCase().includes(word.toLowerCase()) && Math.random() < chance) {
				msg.react(emoji_id);
				timestamp(`Patted ${msg.author.username}`);
				return;
			}
		}
	}

	if (Math.random() < default_chance) {
		msg.react(emoji_id);
		timestamp(`Patted ${msg.author.username}`);
		return;
	}
});

client.login(process.env.TOKEN);
