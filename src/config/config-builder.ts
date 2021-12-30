import { promises as fsp } from 'fs';
import YAML from 'yaml';
import { Config } from '../constants';

/**
 * Parses and builds the app's configuration from a YAML file.
 */
export class ConfigBuilder {
    constructor(private readonly filename: string) {}

    async build(): Promise<Config> {
        const buffer = await fsp.readFile(this.filename, 'utf-8');
        const config = YAML.parse(buffer) as Config;
        return config;
    }
}
