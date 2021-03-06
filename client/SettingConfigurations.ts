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

export class SettingConfigurations {

    // In order to migrate old values to new values, we need to bump up the 'migrationCheck' value in extension.ts.

    // FABRIC CONFIGURATIONS
    static readonly FABRIC_RUNTIME: string = 'ibm-blockchain-platform.fabric.runtime';
    static readonly FABRIC_GATEWAYS: string = 'ibm-blockchain-platform.fabric.gateways';
    static readonly FABRIC_WALLETS: string = 'ibm-blockchain-platform.fabric.wallets';

    // EXTENSION CONFIGURATIONS
    static readonly EXTENSION_DIRECTORY: string = 'ibm-blockchain-platform.ext.directory';
    static readonly EXTENSION_REPOSITORIES: string = 'ibm-blockchain-platform.ext.repositories';

    // HOME CONFIGURATIONS
    static readonly HOME_SHOW_ON_STARTUP: string = 'ibm-blockchain-platform.home.showOnStartup';

}
