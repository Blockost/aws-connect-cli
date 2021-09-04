import { spawn } from 'child_process';
import { NodeSSH } from 'node-ssh';
import { ClientChannel } from 'ssh2';
import { AbstractCustomSSHClient } from './abstract-client';

/**
 * This is an attempt at using node "ssh2" package (SSH client) to connect to EC2 instances through AWS SSM.
 *
 * Disclaimer: THIS DOES NOT WORK :'(
 */
export class SSH2Client extends AbstractCustomSSHClient {
  async startInteractiveSession(): Promise<void> {
    this.sendSSHKey();
    this.ssmTunnel();
  }

  async forwardTraffic(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private ssmTunnel() {
    console.log('Running SSM command');

    const ssmProcess = spawn('aws', [
      'ssm',
      'start-session',
      '--target',
      this.instanceDetails.id,
      '--region',
      this.instanceDetails.region,
      '--document',
      'AWS-StartSSHSession',
      '--parameters',
      'portNumber=22',
    ]);

    ssmProcess.stdout
      .once('readable', () => {
        console.log('[SSM Command] readable now !');
        this.do(ssmProcess.stdout);
      })
      .on('data', (data) => {
        console.log('[SSM Command] stdout data: ' + data);
      })
      .on('error', (err) => {
        console.log('[SSM Command] stdout error: ' + err);
      })
      .on('close', () => {
        console.log('SSH connection closed');
      });
  }

  private async do(stream: NodeJS.ReadableStream) {
    let ssh: NodeSSH | undefined;

    try {
      ssh = await this.connect(stream);
    } catch (error) {
      console.error('SSH connection failed:');
      console.error(error);
      return;
    }

    try {
      await this.startInteractiveShell(ssh);
      ssh.dispose();
    } catch (error) {
      console.error('Fail to start interactive shell: ' + error);
    }

    console.log('SSH connection terminated. Bye bye !');
  }

  private async connect(stream: NodeJS.ReadableStream): Promise<NodeSSH> {
    const ssh = new NodeSSH();

    console.log(`Trying to connect to ${this.instanceDetails.name}`);

    try {
      await ssh.connect({
        host: this.instanceDetails.id,
        username: this.instanceDetails.shellUser,
        // agent: process.env.SSH_AUTH_SOCK,
        // compress: true,
        privateKey: this.sshConfig.privateKeyFilePath,
        sock: stream, // TODO: 2021-08-22 Simon This does not work, data are not flowing through stream...
      });

      console.log('Connection established !');

      return Promise.resolve(ssh);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private async startInteractiveShell(ssh: NodeSSH): Promise<void> {
    console.log('Starting interactive shell...');

    return await new Promise((resolve, reject) => {
      if (!ssh.connection) {
        reject('SSH connection is null');
        return;
      }

      ssh.connection.shell({ term: process.env.TERM || 'vt100' }, (err, stream) => {
        if (err) {
          console.error('Shell error: ' + err);
          reject();
          return;
        }

        // Pipe magic to enable interaction with shell
        this.pipeStream(stream);

        stream.on('close', () => {
          console.log('Stream closed');
          resolve();
        });
      });
    });
  }

  private pipeStream(stream: ClientChannel) {
    const { stdin, stdout, stderr } = process;
    const { isTTY } = stdout;

    if (isTTY && stdin.setRawMode) {
      stdin.setRawMode(true);
    }

    stream.pipe(stdout);
    stream.stderr.pipe(stderr);
    stdin.pipe(stream);

    const onResize = () => stream.setWindow(stdout.rows, stdout.columns, 0, 0);
    if (isTTY) {
      stream.once('data', onResize);
      process.stdout.on('resize', onResize);
    }

    stream.on('close', () => {
      if (isTTY) {
        process.stdout.removeListener('resize', onResize);
      }
      stream.unpipe();
      stream.stderr.unpipe();
      stdin.unpipe();
      if (stdin.setRawMode) {
        stdin.setRawMode(false);
      }
      stdin.unref();
    });
  }
}
