export interface Config {
    ssh: SSHConfig;
    instances: InstanceDetails[];
    awscli?: AWSCLIConfig;
}

export interface SSHConfig {
    useExistingKeyPair: boolean;
    publicKeyFilePath: string;
    privateKeyFilePath: string;
}

export interface AWSCLIConfig {
    profile: string;
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

export interface FileCopyOptions {
    mode: FileCopyMode;
    fileLocation: string;
    destination: string;
    recursive: boolean;
}

export enum FileCopyMode {
    UPLOAD = 'Copy from local to remote (upload)',
    DOWNLOAD = 'copy from remote to local (download)',
}

export enum AvailableCommand {
    START_INTERACTIVE_SHELL_COMMAND = 'Start interactive shell',
    FORWARD_TRAFFIC_COMMAND = 'Forward traffic',
    COPY_FILE_COMMAND = 'Copy file',
}
