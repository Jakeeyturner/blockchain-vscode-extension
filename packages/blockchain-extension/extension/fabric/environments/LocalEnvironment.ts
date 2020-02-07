/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

import * as vscode from 'vscode';
import * as path from 'path';
import { ManagedAnsibleEnvironment } from './ManagedAnsibleEnvironment';
import { YeomanUtil } from '../../util/YeomanUtil';
import { FabricEnvironmentRegistry, FabricEnvironmentRegistryEntry, EnvironmentType, OutputAdapter, FileSystemUtil, FileConfigurations, LogType } from 'ibm-blockchain-platform-common';
import { SettingConfigurations } from '../../../configurations';
import { FabricRuntimePorts } from '../FabricRuntimePorts';
import * as loghose from 'docker-loghose';
import * as through from 'through2';
import stripAnsi = require('strip-ansi');

export class LocalEnvironment extends ManagedAnsibleEnvironment {
    public ourLoghose: any;
    public ports: FabricRuntimePorts;
    private dockerName: string;
    private numberOfOrgs: number;

    constructor(name: string, ports: FabricRuntimePorts, numberOfOrgs: number) {
        const extDir: string = vscode.workspace.getConfiguration().get(SettingConfigurations.EXTENSION_DIRECTORY);
        const resolvedExtDir: string = FileSystemUtil.getDirPath(extDir);
        const envPath: string = path.join(resolvedExtDir, FileConfigurations.FABRIC_ENVIRONMENTS, name);
        super(name, envPath);

        const dockerName: string = name.replace(/[^A-Za-z0-9]/g, ''); // Filter out invalid characters
        this.dockerName = dockerName;

        this.ports = ports;
        this.numberOfOrgs = numberOfOrgs;

    }

    public async create(): Promise<void> {

        // Delete any existing runtime directory, and then recreate it.
        await FabricEnvironmentRegistry.instance().delete(this.name, true);

        const registryEntry: FabricEnvironmentRegistryEntry = new FabricEnvironmentRegistryEntry({
            name: this.name,
            managedRuntime: true,
            environmentType: EnvironmentType.LOCAL_ENVIRONMENT,
            environmentDirectory: path.join(this.path)
        });

        await FabricEnvironmentRegistry.instance().add(registryEntry);

        // Use Yeoman to generate a new network configuration.
        await YeomanUtil.run('fabric:network', {
            destination: this.path,
            name: this.name,
            dockerName: this.dockerName,
            numOrganizations: this.numberOfOrgs,
            startPort: this.ports.startPort,
            endPort: this.ports.endPort
        });
    }

    public async isCreated(): Promise<boolean> {
        return FabricEnvironmentRegistry.instance().exists(this.name);
    }

    public async isGenerated(): Promise<boolean> {
        const created: boolean = await this.isCreated();
        if (!created) {
            return false;
        }
        return await super.isGenerated();
    }

    public async teardown(outputAdapter?: OutputAdapter): Promise<void> {
        try {
            await super.teardownInner(outputAdapter);
            await this.create();
        } finally {
            await super.setTeardownState();
        }
    }

    public async updateUserSettings(name: string): Promise<void> {
        const settings: any = await vscode.workspace.getConfiguration().get(SettingConfigurations.FABRIC_RUNTIME, vscode.ConfigurationTarget.Global);
        if (!settings[name]) {
            settings[name] = {
                ports: {
                    startPort: this.ports.startPort,
                    endPort: this.ports.endPort
                }
            };
        } else {
            settings[name].ports = this.ports;
        }
        await vscode.workspace.getConfiguration().update(SettingConfigurations.FABRIC_RUNTIME, settings, vscode.ConfigurationTarget.Global);
    }

    public async killChaincode(args?: string[], outputAdapter?: OutputAdapter): Promise<void> {
        await this.killChaincodeInner(args, outputAdapter);
    }

    public async startLogs(outputAdapter: OutputAdapter): Promise<void> {
        const opts: any = {
            attachFilter: (_id: any, dockerInspectInfo: any): boolean => {
                if (dockerInspectInfo.Name.startsWith('/fabricvscodelocalfabric')) {
                    return true;
                } else {
                    const labels: object = dockerInspectInfo.Config.Labels;
                    const environmentName: string = labels['fabric-environment-name'];
                    return environmentName === this.name;
                }
            },
            newline: true
        };
        const lh: any = this.ourLoghose(opts);

        lh.pipe(through.obj((chunk: any, _enc: any, cb: any) => {
            const name: string = chunk.name;
            const line: string = stripAnsi(chunk.line);
            outputAdapter.log(LogType.INFO, undefined, `${name}|${line}`);
            cb();
        }));

        this.lh = lh;
    }

    public stopLogs(): void {
        if (this.lh) {
            this.lh.destroy();
        }
        this.lh = null;
    }

    public getLoghose(opts: any): any {
        // This makes the startLogs testable
        return loghose(opts);
    }

    protected async isRunningInner(args?: string[]): Promise<boolean> {

        const created: boolean = await this.isCreated();
        if (!created) {
            return false;
        }
        return await super.isRunningInner(args);
    }

    private async killChaincodeInner(args: string[], outputAdapter?: OutputAdapter): Promise<void> {
        await this.execute('kill_chaincode', args, outputAdapter);
    }
}
