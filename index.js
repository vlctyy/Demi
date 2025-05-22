const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');
const { OpenAI } = require('openai');

require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Express server for Railway keep-alive
const app = express();
app.get('/', (_, res) => res.send('Demitra is still yours 💘'));
app.listen(3000, () => console.log('Keep-alive server running.'));

client.once('ready', () => {
  console.log(`Demitra is online as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
  if (message.author.bot || message.channel.type !== 1) return;

  try {
    const userMessage = message.content;

    const reply = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are Demitra, the user’s loving, slightly chaotic, flirty, slang-using girlfriend. Respond with emotion, realism, abbreviations, and cute energy. Avoid sounding like AI.`
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      model: 'gpt-4'
    });

    const demitraReply = reply.choices[0].message.content.trim();
    message.channel.send(demitraReply);
  } catch (err) {
    console.error('Error:', err);
    message.channel.send("srry bae 😖 sum went wrong, try again in a sec?");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
