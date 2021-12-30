import { execSync } from 'child_process';
import { promises as fsp } from 'fs';
import os from 'os';
import path from 'path';
import { Config, InstanceDetails } from '../constants';

/**
 * Abstract client that provides a base implementation to connect to EC2 instances and uses `ec2-instance-connect` to
 * push temporary SSH keys to target instance
 */
export abstract class AbstractClient {
    constructor(protected readonly config: Config, protected readonly instanceDetails: InstanceDetails) {
        console.log(`** => ${this.instanceDetails.name} (${this.instanceDetails.id})`);
    }

    /**
     * Starts an interactive shell to control target EC2 instance.
     */
    abstract startInteractiveSession(): Promise<void>;

    /**
     * Forwards traffic from localhost to target EC2 instance.
     */
    abstract forwardTraffic(): Promise<void>;

    /**
     * Sends an SSH public key to the target EC2 instace via `ec2-instance-connect`.
     */
    protected async sendSSHKey(): Promise<void> {
        if (!this.config.ssh.useExistingKeyPair) {
            await this.generateNewSSHKeyPar();
        }

        console.log(`Pushing temporary SSH public key to EC2 instance`);
        console.log('Key will expire in 60 seconds');

        const awsProfile = this.config.awscli?.profile;

        // TODO: 2021-08-22 Simon Use Async instead
        execSync(
            [
                'aws ec2-instance-connect send-ssh-public-key',
                `${awsProfile ? `--profile ${awsProfile}` : ''}`,
                `--instance-id ${this.instanceDetails.id}`,
                `--region ${this.instanceDetails.region}`,
                `--availability-zone ${this.instanceDetails.availibilityZone}`,
                `--instance-os-user ${this.instanceDetails.shellUser}`,
                `--ssh-public-key file://${this.config.ssh.publicKeyFilePath}`,
            ].join(' '),
            { stdio: 'inherit' }
        );
    }

    private async generateNewSSHKeyPar(): Promise<void> {
        const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'awsconnect-'));
        const tmpKeyPath = `${tmpDir}/rsa-key`;

        console.log(`Generating new SSH key pair on-the-fly (no passphrase) in "${tmpDir}"`);

        execSync(`ssh-keygen -t rsa -b 4096 -C "awsconnect@example.com" -f ${tmpKeyPath} -q -N ""`);
        this.config.ssh.privateKeyFilePath = tmpKeyPath;
        this.config.ssh.publicKeyFilePath = `${tmpKeyPath}.pub`;
    }
}
