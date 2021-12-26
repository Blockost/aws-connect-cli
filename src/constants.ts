export interface Config {
    ssh: SSHConfig;
    instances: InstanceDetails[];
}

export interface SSHConfig {
    useExistingKeyPair: boolean;
    publicKeyFilePath: string;
    privateKeyFilePath: string;
}

export interface InstanceDetails {
    name: string;
    id: string;
    region: string;
    availibilityZone: string;
    shellUser: string;
    portForwardingOptions?: PortForwardingConfig[];
}

export interface PortForwardingConfig {
    name: string;
    localPort: number;
    remoteHost: string;
    remotePort: number;
}

export const START_INTERACTIVE_SHELL_COMMAND = 'Start interactive shell';
export const FORWARD_TRAFFIC_COMMAND = 'Forward traffic';
