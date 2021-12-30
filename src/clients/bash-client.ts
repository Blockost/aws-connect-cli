// import entire SDK
import { spawn } from 'child_process';
import inquirer from 'inquirer';
import { PortForwardingConfig } from '../constants';
import { AbstractClient } from './abstract-client';

/**
 * Uses Bash commands and aws-cli to connect to EC2 instances.
 */
export class BashBasedClient extends AbstractClient {
    async startInteractiveSession(): Promise<void> {
        await this.sendSSHKey();
        this.connectThroughSsm();
    }

    async forwardTraffic(): Promise<void> {
        const options = this.instanceDetails.portForwardingOptions || [];
        if (options.length < 1) {
            console.error(`Instance ${this.instanceDetails.name} is not configured to forward traffic`);
            return;
        }

        const config = await this.getUserPortFowardingSelection(options);

        await this.sendSSHKey();

        console.log(`Connecting to "${this.instanceDetails.name}" and forwarding local traffic as follows:`);
        console.log(`localhost:${config.localPort} => (${this.instanceDetails.name})${config.remoteHost}:${config.remotePort}`);

        const sshProcess = spawn(
            'ssh',
            [
                '-L',
                `${config.localPort}:${config.remoteHost}:${config.remotePort}`,
                '-N', // Do not start shell, just do nothing, wait patiently and keep the tunnel open
                '-o',
                `ProxyCommand=${this.buildProxyCommand()}`,
                '-o',
                'IdentitiesOnly=yes',
                '-i',
                this.config.ssh.privateKeyFilePath,
                `${this.instanceDetails.shellUser}@${this.instanceDetails.id}`,
            ],
            { stdio: 'inherit' }
        );

        sshProcess
            .once('spawn', () => {
                console.log('[SSH spawned process] spawned successfully !!');
            })
            .on('error', (err) => {
                console.error('[SSH spawned process] error: ' + err);
            })
            .on('close', () => {
                console.log('[SSH spawned process] closed');
            });
    }

    private connectThroughSsm() {
        const sshProcess = spawn(
            'ssh',
            [
                '-o',
                `ProxyCommand=${this.buildProxyCommand()}`,
                '-o',
                'IdentitiesOnly=yes',
                '-i',
                this.config.ssh.privateKeyFilePath,
                `${this.instanceDetails.shellUser}@${this.instanceDetails.id}`,
            ],
            { stdio: 'inherit' }
        );

        sshProcess
            .on('spawn', () => {
                console.log('[SSH spawned process] spawned successfully !!');
            })
            .on('error', (err) => {
                console.error('[SSH spawned process] error: ' + err);
            })
            .on('close', () => {
                console.log('[SSH spawned process] closed');
                console.log(`You are no longer connected to "${this.instanceDetails.name}". Bye bye !`);
            });
    }

    private buildProxyCommand(): string {
        const awsProfile = this.config.awscli?.profile;
        return [
            'aws ssm start-session',
            '--target %h',
            `--region ${this.instanceDetails.region}`,
            '--document AWS-StartSSHSession',
            '--parameters portNumber=%p',
            `${awsProfile ? `--profile ${awsProfile}` : ''}`,
        ].join(' ');
    }

    private async getUserPortFowardingSelection(options: PortForwardingConfig[]): Promise<PortForwardingConfig> {
        const command = (
            await inquirer.prompt({
                type: 'list',
                name: 'command',
                message: 'Select a port forwarding configuration',
                choices: [...options.map((o) => o.name), 'Enter manually'],
            })
        ).command as string;

        if (command === 'Enter manually') {
            const localPort = (
                await inquirer.prompt({
                    type: 'number',
                    name: 'localPort',
                    message: 'Specify the local port to forward to the remote instance',
                })
            ).localPort as number;
            const remoteHost = (
                await inquirer.prompt({
                    type: 'input',
                    name: 'remoteHost',
                    message: 'Specify the remote host **address** to forward to',
                    default: 'localhost',
                })
            ).remoteHost as string;

            const remotePort = (
                await inquirer.prompt({
                    type: 'number',
                    name: 'remotePort',
                    message: 'Specify the remote host **port** to forward to',
                })
            ).remotePort as number;

            return { name: 'Manual', remoteHost, remotePort, localPort };
        } else {
            const config = options.find((o) => o.name === command);
            if (!config) {
                throw new Error(`No port forwarding configuration with name "${command}"`);
            } else {
                return config;
            }
        }
    }
}
