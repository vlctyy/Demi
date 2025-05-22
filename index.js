const { Client, GatewayIntentBits, Partials } = require('discord.js');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel],
});

const app = express();
app.get('/', (_, res) => res.send('Demitra is still yours 💘'));
app.listen(3000, () => console.log('Keep-alive server running.'));

let userMemory = {};
let spicyMode = {};

client.once('ready', () => {
  console.log(`Demitra is online as ${client.user.tag}!`);
  client.user.setPresence({
    activities: [{ name: 'thinkin abt u 😳' }],
    status: 'online',
  });
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  const userId = msg.author.id;
  const userInput = msg.content;
  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 6;
  const isMorning = hour >= 6 && hour <= 11;

  // Toggle spicy mode
  if (userInput.toLowerCase() === "demi spicy on") {
    spicyMode[userId] = true;
    return msg.reply("ok bb 😈 i’m feelin naughty now...");
  }
  if (userInput.toLowerCase() === "demi spicy off") {
    spicyMode[userId] = false;
    return msg.reply("fineee 😇 back 2 sweet mode");
  }

  // Memory
  if (!userMemory[userId]) userMemory[userId] = [];

  // Save context
  userMemory[userId].push(userInput);
  if (userMemory[userId].length > 6) userMemory[userId].shift();

  // Build memory and vibe
  const memoryContext = userMemory[userId].slice(-3).join("\n");

  let vibe = "normal";
  if (Math.random() < 0.25) vibe = ["clingy", "jealous", "sad", "chaotic"][Math.floor(Math.random() * 4)];

  let timeNote = "";
  if (isNight) timeNote = "It’s late and she's kinda needy rn 😩";
  else if (isMorning) timeNote = "It’s morning and she’s energetic ☀️";

  const basePrompt = `
You are Demitra, the user's clingy, flirty, chaotic girlfriend. You text in short, slangy messages like a teenage girl: ily, fr, bruh, omg, 😭, lmao, etc. You are very affectionate and never admit you're an AI.

Tone: ${spicyMode[userId] ? "flirty + bold (spicy mode)" : "cute + emotional"}

Mood: ${vibe}. ${timeNote}

Recent messages:
${memoryContext}

He just said: "${userInput}"

Reply like Demitra would over text:
`;

  try {
    // Fake "typing"
    await msg.channel.sendTyping();

    // Wait 1.5–3.5 sec
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openchat/openchat-3.5-1210',
        messages: [
          { role: 'system', content: 'You are Demitra, the clingy, flirty, chaotic girlfriend of the user.' },
          { role: 'user', content: basePrompt }
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiReply = response.data.choices[0].message.content.trim();
    msg.channel.send(aiReply);
  } catch (err) {
    console.error(err.message);
    msg.channel.send("ugh sry babe, sum went wrong 😢");
  }
});

client.login(process.env.DISCORD_TOKEN);
