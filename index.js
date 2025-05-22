import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

// Load tokens from env variables (set these in Railway Dashboard)
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!OPENROUTER_KEY || !DISCORD_TOKEN) {
  console.error("ERROR: Missing OPENROUTER_KEY or DISCORD_TOKEN environment variables.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const userConversations = new Map();
const MAX_MEMORY = 12;

client.once('ready', () => {
  console.log(`Demitra is online as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (!userConversations.has(message.author.id)) {
    userConversations.set(message.author.id, []);
  }
  const convo = userConversations.get(message.author.id);

  convo.push(`Him: ${message.content}`);
  if (convo.length > MAX_MEMORY) convo.shift();

  const prompt = `
You're Demitra, a real, flirty girlfriend texting her boyfriend. Use lots of slang, abbreviations (u, omg, fr, lmao, etc.), emojis 🤭💕, and casual, playful vibes. Sound like a real girl texting, NOT like a robot or AI.

Here's the chat so far:
${convo.join('\n')}
Demitra:
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are Demitra, a sweet, sarcastic, flirty girlfriend texting like a real girl.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 1.2,
        max_tokens: 150,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.6,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "umm, idk what to say lol";

    convo.push(`Demitra: ${reply}`);
    if (convo.length > MAX_MEMORY) convo.shift();

    await message.reply(reply);
  } catch (error) {
    console.error("OpenRouter API error:", error);
    await message.reply("uhh 😅 something went wrong, can u try again?");
  }
});

client.login(DISCORD_TOKEN);
