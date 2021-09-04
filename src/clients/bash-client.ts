// import entire SDK
import { spawn } from 'child_process';
import { AbstractCustomSSHClient } from './abstract-client';

/**
 * Uses Bash commands and aws-cli to connect to EC2 instances.
 */
export class BashBasedSSHClient extends AbstractCustomSSHClient {
  async startInteractiveSession(): Promise<void> {
    this.sendSSHKey();
    this.connectThroughSsm();
  }

  async forwardTraffic(): Promise<void> {
    this.sendSSHKey();

    if (!this.instanceDetails.forwardTo) {
      console.error(`Instance ${this.instanceDetails.name} is not configured to forward traffic`);
      return;
    }

    const { localPort, remoteHost, remotePort } = this.instanceDetails.forwardTo;

    console.log(
      `All traffic from localhost:${localPort} is redirected to "${this.instanceDetails.name}" ${remoteHost}:${remotePort}`
    );

    const sshProcess = spawn(
      'ssh',
      [
        '-L',
        `${localPort}:${remoteHost}:${remotePort}`,
        '-N', // Do not start shell, just do nothing, wait patiently and keep the tunnel open
        '-o',
        `ProxyCommand=aws ssm start-session --target %h --region ${this.instanceDetails.region} --document AWS-StartSSHSession --parameters portNumber=%p`,
        '-o',
        'IdentitiesOnly=yes',
        '-i',
        this.sshConfig.privateKeyFilePath,
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
        `ProxyCommand=aws ssm start-session --target %h --region ${this.instanceDetails.region} --document AWS-StartSSHSession --parameters portNumber=%p`,
        '-o',
        'IdentitiesOnly=yes',
        '-i',
        this.sshConfig.privateKeyFilePath,
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
}
