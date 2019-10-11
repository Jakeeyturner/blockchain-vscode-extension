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
import * as path from 'path';
export class Terminal {

    public static instance(): Terminal {
        return Terminal._instance;
    }

    private static _instance: Terminal = new Terminal();

    private terminal: vscode.Terminal;
    private constructor() {
        this.terminal = vscode.window.createTerminal({
            name: 'IBM Blockchain Platform Extension',
            hideFromUser: false
        });
    }

    public show(): void {
        this.terminal.show();
    }

    public dispose(): void {
        this.terminal.dispose();
    }

    public sendCommand(text: string, dir?: string): void {
        if (dir) {
            const isAbsolute: boolean = path.isAbsolute(dir);
            if (!isAbsolute) {
                throw new Error('Directory must be an absolute path');
            }
            this.terminal.sendText(`cd ${dir}`);
        }

        this.terminal.sendText(text);
    }

}
