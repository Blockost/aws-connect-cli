import { execSync } from 'child_process';
import { InstanceDetails, SSHConfig } from '../constants';

/**
 * Abstract client that provides a base implementation to connect to EC2 instances and uses `ec2-instance-connect` to
 * push temporary SSH keys to target instance
 */
export abstract class AbstractClient {
    constructor(protected readonly sshConfig: SSHConfig, protected readonly instanceDetails: InstanceDetails) {
        console.log(`** => ${this.instanceDetails.name} (${this.instanceDetails.id})`);
    }

    abstract startInteractiveSession(): Promise<void>;

    abstract forwardTraffic(): Promise<void>;

    protected sendSSHKey(): void {
        console.log(`Pushing temporary SSH public key to EC2 instance`);
        console.log('Key will expire in 60 seconds');

        // TODO: 2021-08-22 Simon Use Async instead
        execSync(
            `aws ec2-instance-connect send-ssh-public-key \
              --instance-id ${this.instanceDetails.id} \
              --region ${this.instanceDetails.region} \
              --availability-zone ${this.instanceDetails.availibilityZone} \
              --instance-os-user ${this.instanceDetails.shellUser} \
              --ssh-public-key file://${this.sshConfig.publicKeyFilePath}`,
            { stdio: 'inherit' }
        );
    }
}
