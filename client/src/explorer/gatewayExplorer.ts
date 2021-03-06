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

// tslint:disable max-classes-per-file
'use strict';
import * as vscode from 'vscode';
import { ChannelTreeItem } from './model/ChannelTreeItem';
import { BlockchainTreeItem } from './model/BlockchainTreeItem';
import { GatewayTreeItem } from './model/GatewayTreeItem';
import { GatewayAssociatedTreeItem } from './model/GatewayAssociatedTreeItem';
import { GatewayDissociatedTreeItem } from './model/GatewayDissociatedTreeItem';
import { FabricConnectionManager } from '../fabric/FabricConnectionManager';
import { BlockchainExplorerProvider } from './BlockchainExplorerProvider';
import { FabricGatewayRegistryEntry } from '../fabric/FabricGatewayRegistryEntry';
import { TransactionTreeItem } from './model/TransactionTreeItem';
import { InstantiatedChaincodeTreeItem } from './model/InstantiatedChaincodeTreeItem';
import { ConnectedTreeItem } from './model/ConnectedTreeItem';
import { MetadataUtil } from '../util/MetadataUtil';
import { ContractTreeItem } from './model/ContractTreeItem';
import { VSCodeBlockchainOutputAdapter } from '../logging/VSCodeBlockchainOutputAdapter';
import { LogType } from '../logging/OutputAdapter';
import { FabricRuntimeManager } from '../fabric/FabricRuntimeManager';
import { LocalGatewayTreeItem } from './model/LocalGatewayTreeItem';
import { FabricGatewayRegistry } from '../fabric/FabricGatewayRegistry';
import { ExtensionCommands } from '../../ExtensionCommands';
import { InstantiatedContractTreeItem } from './model/InstantiatedContractTreeItem';
import { InstantiatedTreeItem } from './runtimeOps/InstantiatedTreeItem';
import { IFabricClientConnection } from '../fabric/IFabricClientConnection';
import { InstantiatedMultiContractTreeItem } from './model/InstantiatedMultiContractTreeItem';

export class BlockchainGatewayExplorerProvider implements BlockchainExplorerProvider {

    // only for testing so can get the updated tree
    public tree: Array<BlockchainTreeItem> = [];

    // tslint:disable-next-line member-ordering
    private _onDidChangeTreeData: vscode.EventEmitter<any | undefined> = new vscode.EventEmitter<any | undefined>();

    // tslint:disable-next-line member-ordering
    readonly onDidChangeTreeData: vscode.Event<any | undefined> = this._onDidChangeTreeData.event;

    private fabricGatewayRegistry: FabricGatewayRegistry = FabricGatewayRegistry.instance();

    constructor() {
        const outputAdapter: VSCodeBlockchainOutputAdapter = VSCodeBlockchainOutputAdapter.instance();

        FabricConnectionManager.instance().on('connected', async () => {
            try {
                await this.connect();
            } catch (error) {
                outputAdapter.log(LogType.ERROR, `Error handling connected event: ${error.message}`, `Error handling connected event: ${error.toString()}`);
            }
        });
        FabricConnectionManager.instance().on('disconnected', async () => {
            try {
                await this.disconnect();
            } catch (error) {
                outputAdapter.log(LogType.ERROR, `Error handling disconnected event: ${error.message}`, `Error handling disconnected event: ${error.toString()}`);
            }
        });
    }

    async refresh(element?: BlockchainTreeItem): Promise<void> {
        this._onDidChangeTreeData.fire(element);
    }

    async connect(): Promise<void> {
        // This controls which menu buttons appear
        await vscode.commands.executeCommand('setContext', 'blockchain-connected', true);
        await this.refresh();
    }

    async disconnect(): Promise<void> {
        // This controls which menu buttons appear
        await vscode.commands.executeCommand('setContext', 'blockchain-connected', false);
        await this.refresh();
    }

    getTreeItem(element: BlockchainTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: BlockchainTreeItem): Promise<BlockchainTreeItem[]> {
        const outputAdapter: VSCodeBlockchainOutputAdapter = VSCodeBlockchainOutputAdapter.instance();

        try {

            if (element) {
                // This won't be called before connecting to a gatewawy
                if (element instanceof ChannelTreeItem) {
                    this.tree = [];
                    const channelElement: ChannelTreeItem = element as ChannelTreeItem;

                    if (channelElement.chaincodes.length > 0) {
                        const instantiatedChaincodes: Array<InstantiatedTreeItem> = await this.createInstantiatedChaincodeTree(element as ChannelTreeItem);
                        this.tree.push(...instantiatedChaincodes);
                    }
                }

                if (element instanceof ConnectedTreeItem && element.label === 'Channels') {
                    try {
                        this.tree = await this.getChannelsTree();
                    } catch (error) {
                        // Added this as it was connecting, but couldn't create channel map and kept erroring.
                        // This reverts the view back to the unconnected tree.
                        this.tree = await this.createConnectionTree();

                        outputAdapter.log(LogType.ERROR, `Could not connect to gateway: ${error.message}`);
                    }
                }

                // This won't be called before connecting to a gateway
                if (element instanceof InstantiatedContractTreeItem) {
                    this.tree = await this.createContractTree(element as InstantiatedContractTreeItem);
                }

                // This won't be called before connecting to a gatewawy
                if (element instanceof ContractTreeItem) {
                    this.tree = await this.createTransactionsChaincodeTree(element as ContractTreeItem);
                }

                return this.tree;
            }

            if (FabricConnectionManager.instance().getConnection()) {
                // If connected to a gateway
                this.tree = await this.createConnectedTree();
            } else {
                // If not connected to a gateway
                this.tree = await this.createConnectionTree();
            }

        } catch (error) {
            outputAdapter.log(LogType.ERROR, error.message);
        }

        return this.tree;
    }

    private async createConnectionTree(): Promise<BlockchainTreeItem[]> {
        const outputAdapter: VSCodeBlockchainOutputAdapter = VSCodeBlockchainOutputAdapter.instance();

        const tree: BlockchainTreeItem[] = [];

        const allGateways: FabricGatewayRegistryEntry[] = this.fabricGatewayRegistry.getAll();

        try {
            const runtimeGateways: FabricGatewayRegistryEntry[] = await FabricRuntimeManager.instance().getGatewayRegistryEntries();
            for (const runtimeGateway of runtimeGateways) {
                const command: vscode.Command = {
                    command: ExtensionCommands.CONNECT,
                    title: '',
                    arguments: [runtimeGateway]
                };

                const treeItem: LocalGatewayTreeItem = await LocalGatewayTreeItem.newLocalGatewayTreeItem(
                    this,
                    runtimeGateway.name,
                    runtimeGateway,
                    vscode.TreeItemCollapsibleState.None,
                    command
                );

                tree.push(treeItem);
            }

        } catch (error) {
            outputAdapter.log(LogType.ERROR, `Error populating Blockchain Explorer View: ${error.message}`, `Error populating Blockchain Explorer View: ${error.toString()}`);
        }

        for (const gateway of allGateways) {

            const command: vscode.Command = {
                command: ExtensionCommands.CONNECT,
                title: '',
                arguments: [gateway]
            };

            if (gateway.associatedWallet) {
                tree.push(new GatewayAssociatedTreeItem(this,
                    gateway.name,
                    gateway,
                    vscode.TreeItemCollapsibleState.None,
                    command)
                );
            } else {
                tree.push(new GatewayDissociatedTreeItem(this,
                    gateway.name,
                    gateway,
                    vscode.TreeItemCollapsibleState.None,
                    command)
                );
            }

        }

        tree.sort((connectionA: GatewayTreeItem, connectionB: GatewayTreeItem) => {
            if (connectionA.label > connectionB.label) {
                return 1;
            } else if (connectionA.label < connectionB.label) {
                return -1;
            } else {
                return 0;
            }
        });

        return tree;
    }

    private async createInstantiatedChaincodeTree(channelTreeElement: ChannelTreeItem): Promise<Array<InstantiatedTreeItem>> {
        const tree: Array<InstantiatedTreeItem> = [];

        for (const instantiatedChaincode of channelTreeElement.chaincodes) {
            const connection: IFabricClientConnection = FabricConnectionManager.instance().getConnection();
            const contracts: Array<string> = await MetadataUtil.getContractNames(connection, instantiatedChaincode.name, channelTreeElement.label);
            if (!contracts) {
                tree.push(new InstantiatedChaincodeTreeItem(this, instantiatedChaincode.name, channelTreeElement, instantiatedChaincode.version, vscode.TreeItemCollapsibleState.None, contracts, true));
                continue;
            }

            if (contracts.length === 0) {
                const collapsedState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None;
                tree.push(new InstantiatedContractTreeItem(this, instantiatedChaincode.name, channelTreeElement, instantiatedChaincode.version, collapsedState, contracts, true));

            } else if (contracts.length === 1) {
                const collapsedState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                tree.push(new InstantiatedContractTreeItem(this, instantiatedChaincode.name, channelTreeElement, instantiatedChaincode.version, collapsedState, contracts, true));
            } else {
                const collapsedState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                tree.push(new InstantiatedMultiContractTreeItem(this, instantiatedChaincode.name, channelTreeElement, instantiatedChaincode.version, collapsedState, contracts, true));
            }
        }

        return tree;
    }

    private async createContractTree(chainCodeElement: InstantiatedChaincodeTreeItem): Promise<Array<ContractTreeItem>> {
        const tree: Array<any> = [];
        for (const contract of chainCodeElement.contracts) {
            const connection: IFabricClientConnection = FabricConnectionManager.instance().getConnection();
            const transactionNamesMap: Map<string, string[]> = await MetadataUtil.getTransactionNames(connection, chainCodeElement.name, chainCodeElement.channel.label);
            const transactionNames: string[] = transactionNamesMap.get(contract);
            if (contract === '' || chainCodeElement.contracts.length === 1) {
                for (const transaction of transactionNames) {
                    tree.push(new TransactionTreeItem(this, transaction, chainCodeElement.name, chainCodeElement.channel.label, contract));
                }
            } else {
                tree.push(new ContractTreeItem(this, contract, vscode.TreeItemCollapsibleState.Collapsed, chainCodeElement, transactionNames));
            }
        }
        return tree;
    }

    private async createTransactionsChaincodeTree(contractTreeElement: ContractTreeItem): Promise<Array<TransactionTreeItem>> {
        const tree: Array<TransactionTreeItem> = [];
        contractTreeElement.transactions.forEach((transaction: string) => {
            tree.push(new TransactionTreeItem(this, transaction, contractTreeElement.instantiatedChaincode.name, contractTreeElement.instantiatedChaincode.channel.label, contractTreeElement.name));
        });

        return tree;
    }

    private async createConnectedTree(): Promise<Array<BlockchainTreeItem>> {

        try {
            const tree: Array<BlockchainTreeItem> = [];

            const connection: IFabricClientConnection = FabricConnectionManager.instance().getConnection();
            const gatewayRegistryEntry: FabricGatewayRegistryEntry = FabricConnectionManager.instance().getGatewayRegistryEntry();
            tree.push(new ConnectedTreeItem(this, `Connected via gateway: ${gatewayRegistryEntry.name}`, gatewayRegistryEntry, 0));
            tree.push(new ConnectedTreeItem(this, `Using ID: ${connection.identityName}`, gatewayRegistryEntry, 0));
            tree.push(new ConnectedTreeItem(this, `Channels`, gatewayRegistryEntry, vscode.TreeItemCollapsibleState.Expanded));

            return tree;
        } catch (error) {
            FabricConnectionManager.instance().disconnect();
            throw error;
        }
    }

    private async getChannelsTree(): Promise<ChannelTreeItem[]> {
        const outputAdapter: VSCodeBlockchainOutputAdapter = VSCodeBlockchainOutputAdapter.instance();
        try {
            const connection: IFabricClientConnection = FabricConnectionManager.instance().getConnection();

            const channelMap: Map<string, Array<string>> = await connection.createChannelMap();
            const channels: Array<string> = Array.from(channelMap.keys());

            const tree: Array<ChannelTreeItem> = [];

            for (const channel of channels) {
                let chaincodes: Array<{ name: string, version: string }>;
                const peers: Array<string> = channelMap.get(channel);
                try {
                    chaincodes = await connection.getInstantiatedChaincode(channel);
                    if (chaincodes.length > 0) {
                        tree.push(new ChannelTreeItem(this, channel, peers, chaincodes, vscode.TreeItemCollapsibleState.Collapsed));
                    } else {
                        tree.push(new ChannelTreeItem(this, channel, peers, chaincodes, vscode.TreeItemCollapsibleState.None));
                    }
                } catch (error) {
                    tree.push(new ChannelTreeItem(this, channel, peers, [], vscode.TreeItemCollapsibleState.None));
                    outputAdapter.log(LogType.ERROR, `Error getting instantiated smart contracts for channel ${channel} ${error.message}`);
                }
            }
            return tree;
        } catch (error) {
            FabricConnectionManager.instance().disconnect();

            throw error;
        }
    }
}
