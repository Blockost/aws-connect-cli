import { Command } from 'commander';
import { promises as fsp } from 'fs';
import inquirer from 'inquirer';
import YAML from 'yaml';
import { BashBasedSSHClient } from './clients/bash-client';
import {
  Config,
  FORWARD_TRAFFIC as FORWARD_TRAFFIC_COMMAND,
  INTERACTIVE_SHELL_COMMAND as START_INTERACTIVE_SHELL_COMMAND,
} from './constants';

const program = new Command();
program.option('-f, --file <path>', 'Path to connections configuration file', './config.yml');
program.parse(process.argv);
const { file } = program.opts();

(async () => {
  const buffer = await fsp.readFile(file, 'utf-8');
  const config = YAML.parse(buffer) as Config;
  const instances = config.instances;

  const command = (
    await inquirer.prompt({
      type: 'list',
      name: 'command',
      message: 'What do you want to do?',
      choices: [START_INTERACTIVE_SHELL_COMMAND, FORWARD_TRAFFIC_COMMAND],
    })
  ).command as string;

  const instanceName = (
    await inquirer.prompt({
      type: 'list',
      name: 'instance',
      message: 'Choose an instance',
      choices: instances.map((i) => i.name),
    })
  ).instance as string;

  const selectedInstance = instances.find((i) => i.name === instanceName);
  if (!selectedInstance) {
    throw new Error(`Unknown instance: ${instanceName}`);
  }

  const sshClient = new BashBasedSSHClient(config.ssh, selectedInstance);

  if (command === START_INTERACTIVE_SHELL_COMMAND) {
    sshClient.startInteractiveSession();
  } else if (command === FORWARD_TRAFFIC_COMMAND) {
    sshClient.forwardTraffic();
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
})();
