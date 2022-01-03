import { Command } from 'commander';
import inquirer from 'inquirer';
import { version } from '../version';
import { BashBasedClient } from './clients/bash-client';
import { ConfigBuilder } from './config/config-builder';
import { FORWARD_TRAFFIC_COMMAND, START_INTERACTIVE_SHELL_COMMAND } from './constants';

const program = new Command();
program.option('-f, --file <path>', 'Path to connections configuration file', './config.yml');
program.option('-v, --version', 'Show version');
program.parse(process.argv);
const options = program.opts();

if (options.version) {
    console.log(version);
    process.exit(0);
}

(async () => {
    const { file } = options;
    const config = await new ConfigBuilder(file).build();
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

    const client = new BashBasedClient(config, selectedInstance);

    try {
        switch (command) {
            case START_INTERACTIVE_SHELL_COMMAND:
                await client.startInteractiveSession();
                break;

            case FORWARD_TRAFFIC_COMMAND:
                await client.forwardTraffic();
                break;

            default:
                throw new Error(`Unknown command: ${command}`);
        }
    } catch (error) {
        console.error(`An error occurred while running command "${command}". See details above ^^^^`);
    }
})();
