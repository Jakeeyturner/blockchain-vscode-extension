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
'use strict';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as vscode from 'vscode';
import { UserInputUtil, IBlockchainQuickPickItem } from './UserInputUtil';
import { Reporter } from '../util/Reporter';
import { VSCodeBlockchainOutputAdapter } from '../logging/VSCodeBlockchainOutputAdapter';
import { FabricEnvironmentRegistry, FabricEnvironmentRegistryEntry, FabricRuntimeUtil, LogType, EnvironmentType } from 'ibm-blockchain-platform-common';
import { ExtensionCommands } from '../../ExtensionCommands';
import { ExtensionUtil } from '../util/ExtensionUtil';
import { LocalEnvironmentManager } from '../fabric/environments/LocalEnvironmentManager';
import { LocalEnvironment } from '../fabric/environments/LocalEnvironment';

export async function addEnvironment(): Promise<void> {
    const outputAdapter: VSCodeBlockchainOutputAdapter = VSCodeBlockchainOutputAdapter.instance();
    const fabricEnvironmentEntry: FabricEnvironmentRegistryEntry = new FabricEnvironmentRegistryEntry();
    const fabricEnvironmentRegistry: FabricEnvironmentRegistry = FabricEnvironmentRegistry.instance();
    try {
        outputAdapter.log(LogType.INFO, undefined, 'Add environment');

        const items: IBlockchainQuickPickItem<string>[] = [{label: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE, data: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE, description: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE_DESCRIPTION}, {label: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR, data: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR, description: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR_DESCRIPTION}, {label: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES, data: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES, description: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES_DESCRIPTION}];
        const chosenMethod: IBlockchainQuickPickItem<string> = await UserInputUtil.showQuickPickItem('Select a method to add an environment', items) as IBlockchainQuickPickItem<string>;

        let envDir: string;
        if (!chosenMethod) {
            return;
        }

        const createMethod: string = chosenMethod.data;

        let configurationChosen: string; // Configuration chosen (e.g. 1 Org, 2 Org)

        if (createMethod === UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE) {
            const templateItems: IBlockchainQuickPickItem<string>[] = [{label: UserInputUtil.ONE_ORG_TEMPLATE, data: UserInputUtil.ONE_ORG_TEMPLATE}, {label: UserInputUtil.TWO_ORG_TEMPLATE, data: UserInputUtil.TWO_ORG_TEMPLATE}, {label: UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS, data: UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS}];
            const chosenTemplate: IBlockchainQuickPickItem<string> = await UserInputUtil.showQuickPickItem('Choose a configuration for a new local network', templateItems) as IBlockchainQuickPickItem<string>;
            if (!chosenTemplate) {
                return;
            }

            configurationChosen = chosenTemplate.data;

            if (configurationChosen === UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS) {
                // Open create additional networks tutorial
                const extensionPath: string = ExtensionUtil.getExtensionPath();
                // TODO JAKE: Change this to whatever the path ends up being!
                const releaseNotes: string = path.join(extensionPath, 'packages', 'blockchain-extension', 'tutorials', 'developer-tutorials', 'create-additional-local-networks.md');
                const uri: vscode.Uri = vscode.Uri.file(releaseNotes);
                await vscode.commands.executeCommand('markdown.showPreview', uri);

                return;
            }

        } else if (createMethod === UserInputUtil.ADD_ENVIRONMENT_FROM_DIR) {
            const options: vscode.OpenDialogOptions = {
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select'
            };

            const chosenUri: vscode.Uri = await UserInputUtil.openFileBrowser(options, true) as vscode.Uri;

            if (!chosenUri) {
                return;
            }

            envDir = chosenUri.fsPath;
        }

        let namePrompt: string;
        if (configurationChosen) {
            namePrompt = 'Provide a name for this Fabric Environment (avoid duplicating an existing name)';
        } else {
            namePrompt = 'Enter a name for the environment';
        }

        const environmentName: string = await UserInputUtil.showInputBox(namePrompt);
        if (!environmentName) {
            return;
        }

        const exists: boolean = await fabricEnvironmentRegistry.exists(environmentName);
        if (exists || environmentName === FabricRuntimeUtil.LOCAL_FABRIC) {
            // Environment already exists
            throw new Error('An environment with this name already exists.');
        }

        // Create environment
        fabricEnvironmentEntry.name = environmentName;

        if (createMethod === UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE) {
            // create it!!

            let numberOfOrgs: number;
            if (configurationChosen === UserInputUtil.ONE_ORG_TEMPLATE) {
                numberOfOrgs = 1;
            } else {
                // User chose TWO_ORG_TEMPLATE
                numberOfOrgs = 2;
            }

            await LocalEnvironmentManager.instance().initialize(environmentName, numberOfOrgs);

            const environment: LocalEnvironment = await LocalEnvironmentManager.instance().getRuntime(environmentName);
            // Generate all nodes, gateways and wallets
            await environment.generate(outputAdapter);

        }

        if (createMethod === UserInputUtil.ADD_ENVIRONMENT_FROM_DIR) {
            fabricEnvironmentEntry.environmentDirectory = envDir;

            const files: string[] = await fs.readdir(envDir);
            if (files.includes('start.sh')) {
                fabricEnvironmentEntry.managedRuntime = true;
            }
            fabricEnvironmentEntry.environmentType = EnvironmentType.ANSIBLE_ENVIRONMENT;
        }

        if (createMethod !== UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE) {
            // We don't want to add an entry if creating from a template, as the initialize handles this.
            await fabricEnvironmentRegistry.add(fabricEnvironmentEntry);
        }

        if (createMethod !== UserInputUtil.ADD_ENVIRONMENT_FROM_DIR && createMethod !== UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE) {

            const addedAllNodes: boolean = await vscode.commands.executeCommand(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT, fabricEnvironmentEntry, true, createMethod) as boolean;
            if (addedAllNodes === undefined) {
                await fabricEnvironmentRegistry.delete(fabricEnvironmentEntry.name);
                return;
            }

            if (addedAllNodes) {
                outputAdapter.log(LogType.SUCCESS, 'Successfully added a new environment');
            } else {
                outputAdapter.log(LogType.WARNING, 'Added a new environment, but some nodes could not be added');
            }
        } else {
            await vscode.commands.executeCommand(ExtensionCommands.REFRESH_WALLETS);
            await vscode.commands.executeCommand(ExtensionCommands.REFRESH_GATEWAYS);
            outputAdapter.log(LogType.SUCCESS, 'Successfully added a new environment');
        }
        Reporter.instance().sendTelemetryEvent('addEnvironmentCommand');
    } catch (error) {
        await fabricEnvironmentRegistry.delete(fabricEnvironmentEntry.name, true);
        outputAdapter.log(LogType.ERROR, `Failed to add a new environment: ${error.message}`, `Failed to add a new environment: ${error.toString()}`);
    }
}
