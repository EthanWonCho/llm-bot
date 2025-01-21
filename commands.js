import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';


const CLEARMESSAGES_COMMAND = {
  name: 'clearmessages',
  description: 'clears the history',
  type: 1
}

const ALL_COMMANDS = [CLEARMESSAGES_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
