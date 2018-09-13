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

import { ExtensionUtil } from '../src/util/ExtensionUtil';
import * as myExtension from '../src/extension';
import * as vscode from 'vscode';

export class TestUtil {
    static async setupTests() {
        if (!ExtensionUtil.isActive()) {
            await ExtensionUtil.activateExtension();
        } else {
            const context: vscode.ExtensionContext = ExtensionUtil.getExtensionContext();
            myExtension.registerCommands(context);
        }

        await this.storePackageDirectory();
    }

    static async storePackageDirectory() {
        this.USER_CONFIG =  await vscode.workspace.getConfiguration().get('fabric.package.directory');
    }

    static async restorePackageDirectory() {
        return await vscode.workspace.getConfiguration().update('fabric.package.directory', this.USER_CONFIG);
    }

    private static USER_CONFIG;
}
