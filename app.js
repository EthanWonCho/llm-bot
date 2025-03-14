import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { DiscordRequest, callChatGPT } from './utils.js';
import { Client, Intents } from 'discord.js'; // Import the default export from discord.js

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }); // Create a client instance

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

var prompt = [
  {
    "role":"developer",
    "content": [{ "type":"text", "text":"너는 \"Digital Media High School\"에 다니는 학생들을 위한 어시스턴트이다. " }]
  }
];

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.DISCORD_PUBLIC_KEY), async function (req, res) {
  // Interaction type and data
  const { type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "clearmessages" command
    if (name === 'clearmessages') {
      try {
        // // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
        // const rst = await DiscordRequest(endpoint, { method: 'GET' });
        // console.log(rst);
        // const stream = rst.body; // Replace with your actual ReadableStream
        // const text = await getFullTextFromReadableStream(stream);
        // console.log('Full Text:', text);
        prompt = [
          {
            "role":"developer",
            "content": [{ "type":"text", "text":"너는 \"Digital Media High School\"에 다니는 학생들을 위한 어시스턴트이다. " }]
          }
        ];
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `B..ye......(Dies)`
          }
        });
      } catch (err) {
        console.error(err);
      }
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async function (message) { // Listen for the "messageCreate" event
  // Check if message is from the bot itself to avoid infinite loops
  if (message.author.bot || message.channelId != 1350037143812182077) return;

  console.log(`got a message!: ${message.content} `);

  prompt.push(
    {
      "role":"user",
      "content":[{ "type":"text", "text":message.content }]
    } 
  );

  const assistant_say = await callChatGPT(prompt);

  prompt.push(
    {
      "role":"assistant",
      "content":[{ "type":"text", "text":assistant_say }]
    }
  );

  // SEND IT!!!
  const endpoint = `channels/1331901049942048819/messages`;
  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands

    const safeAssistantSay = String(assistant_say);
    const rst = await DiscordRequest(endpoint, { 
      method: 'POST', 
      body: {
        content: safeAssistantSay, // This should be a string, not an object
        tts: false // Add this directly to the body
      }
    });
    console.log(rst);

  } catch (err) {
    console.error(err);
  }



});

client.login(process.env.DISCORD_TOKEN)


app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
