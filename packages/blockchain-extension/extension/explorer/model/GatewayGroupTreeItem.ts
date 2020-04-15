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
import * as vscode from 'vscode';
import { BlockchainTreeItem } from './BlockchainTreeItem';
import { BlockchainExplorerProvider } from '../BlockchainExplorerProvider';
import { FabricGatewayRegistryEntry } from 'ibm-blockchain-platform-common';

export class GatewayGroupTreeItem extends BlockchainTreeItem {
    contextValue: string = 'blockchain-gateway-group-item';

    constructor(provider: BlockchainExplorerProvider, public readonly label: string, public readonly gateways: FabricGatewayRegistryEntry[], public readonly collapsableState: vscode.TreeItemCollapsibleState, public readonly command?: vscode.Command) {
        super(provider, label, collapsableState);
    }
}
