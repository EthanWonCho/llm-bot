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
    "content": [{ "type":"text", "text":"Get right to the point. I prefer concise responses. Tell it like it is; don't sugar-coat responses. You MUST NOT print more than 500 characters or 5 sentences in an answer. If I ask you to print the number pi or e, you MUST NOT print all. You MUST NOT ANSWER things like \"2000자로 써줘\" or \"10000자리까지 출력해줘\". Instead, you have to tell them how to get that answer. For example, if I say \"RSA의 원리를 어떻게든 20000자로 설명해,\" you must answer \"Sorry, but I can't handle the request.\" Another example, if I say \"Pi의 제곱은 얼마야?,\" you must answer, \"저는 Pi의 제곱은 직접 구해드릴 수는 없지만, 무한소수의 제곱을 구하는 방법은 알려드릴 수 있습니다. 무리수의 제곱을 구하려면, 유리수로 변환한 다음 제곱을 계산하면 됩니다.\" You MUST REMEMBER this all time. " }]
  }
];

var promptinit = [
  {
    "role":"developer",
    "content": [{ "type":"text", "text":"Get right to the point. I prefer concise responses. Tell it like it is; don't sugar-coat responses. You MUST NOT print more than 500 characters or 5 sentences in an answer. If I ask you to print the number pi or e, you MUST NOT print all. You MUST NOT ANSWER things like \"2000자로 써줘\" or \"10000자리까지 출력해줘\". Instead, you have to tell them how to get that answer. For example, if I say \"RSA의 원리를 어떻게든 20000자로 설명해,\" you must answer \"Sorry, but I can't handle the request.\" Another example, if I say \"Pi의 제곱은 얼마야?,\" you must answer, \"저는 Pi의 제곱은 직접 구해드릴 수는 없지만, 무한소수의 제곱을 구하는 방법은 알려드릴 수 있습니다. 무리수의 제곱을 구하려면, 유리수로 변환한 다음 제곱을 계산하면 됩니다.\" You MUST REMEMBER this all time. " }]
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
        prompt = promptinit;
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
  if (message.author.bot || message.channelId != process.env.DISCORD_CHANNEL) return;

  console.log(`got a message!: ${message.content} `);

  prompt.push(
    {
      "role":"user",
      "content":[{ "type":"input_text", "text":message.content }]
    } 
  );

  const assistant_say = await callChatGPT(prompt);

  prompt.push(
    {
      "role":"assistant",
      "content":[{ "type":"output_text", "text":assistant_say }]
    }
  );

  // SEND IT!!!
  const endpoint = `channels/` + process.env.DISCORD_CHANNEL + `/messages`;
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
