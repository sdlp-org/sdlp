#!/usr/bin/env node

import { Command } from 'commander';
import { keygenCommand } from './commands/keygen.js';
import { signCommand } from './commands/sign.js';
import { verifyCommand } from './commands/verify.js';

const program = new Command();

program
  .name('sdlp')
  .description('CLI for the Secure Deep Link Protocol (SDLP)')
  .version('1.0.0');

// Add commands
program.addCommand(keygenCommand);
program.addCommand(signCommand);
program.addCommand(verifyCommand);

// Parse arguments and execute
program.parse();
