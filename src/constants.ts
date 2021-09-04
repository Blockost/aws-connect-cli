export interface Config {
  ssh: SSHConfig;
  instances: InstanceDetails[];
}

export interface SSHConfig {
  publicKeyFilePath: string;
  privateKeyFilePath: string;
}

export interface InstanceDetails {
  name: string;
  id: string;
  region: string;
  availibilityZone: string;
  shellUser: string;
  forwardTo?: { localPort: number; remoteHost: string; remotePort: number };
}

export const INTERACTIVE_SHELL_COMMAND = 'Start interactive shell';
export const FORWARD_TRAFFIC = 'Forward traffic';