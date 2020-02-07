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
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as path from 'path';
import { TestUtil } from '../TestUtil';
import { VSCodeBlockchainOutputAdapter } from '../../extension/logging/VSCodeBlockchainOutputAdapter';
import { ExtensionCommands } from '../../ExtensionCommands';
import { Reporter } from '../../extension/util/Reporter';
import { FabricEnvironmentRegistry, FabricEnvironmentRegistryEntry, LogType, EnvironmentType, FabricRuntimeUtil } from 'ibm-blockchain-platform-common';
import { LocalEnvironment } from '../../extension/fabric/environments/LocalEnvironment';
import { LocalEnvironmentManager } from '../../extension/fabric/environments/LocalEnvironmentManager';
import { UserInputUtil} from '../../extension/commands/UserInputUtil';
import { ExtensionUtil } from '../../extension/util/ExtensionUtil';

// tslint:disable no-unused-expression
chai.should();
chai.use(sinonChai);

describe('AddEnvironmentCommand', () => {
    let mySandBox: sinon.SinonSandbox;
    let logSpy: sinon.SinonSpy;
    let showInputBoxStub: sinon.SinonStub;
    let chooseNameStub: sinon.SinonStub;
    let executeCommandStub: sinon.SinonStub;
    let sendTelemetryEventStub: sinon.SinonStub;
    let showQuickPickItemStub: sinon.SinonStub;
    let deleteEnvironmentSpy: sinon.SinonSpy;
    let openFileBrowserStub: sinon.SinonStub;
    let environmentDirectoryPath: string;

    before(async () => {
        mySandBox = sinon.createSandbox();
        await TestUtil.setupTests(mySandBox);
    });

    describe('addEnvironment', () => {

        beforeEach(async () => {

            try {
                const localEnvironment: LocalEnvironment = LocalEnvironmentManager.instance().getRuntime(FabricRuntimeUtil.LOCAL_FABRIC);
                if (localEnvironment) {
                    await localEnvironment.teardown();
                }
            } catch (err) {
                //
            }
            await FabricEnvironmentRegistry.instance().clear();

            logSpy = mySandBox.spy(VSCodeBlockchainOutputAdapter.instance(), 'log');
            showQuickPickItemStub = mySandBox.stub(UserInputUtil, 'showQuickPickItem');
            showQuickPickItemStub.resolves({data: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES});
            environmentDirectoryPath = path.join(__dirname, '..', '..', '..', 'test', 'data', 'managedAnsible');
            const uri: vscode.Uri = vscode.Uri.file(environmentDirectoryPath);
            openFileBrowserStub = mySandBox.stub(UserInputUtil, 'openFileBrowser').resolves(uri);
            showInputBoxStub = mySandBox.stub(UserInputUtil, 'showInputBox');
            chooseNameStub = showInputBoxStub.withArgs('Enter a name for the environment');
            chooseNameStub.resolves('myEnvironment');
            executeCommandStub = mySandBox.stub(vscode.commands, 'executeCommand').callThrough();
            executeCommandStub.withArgs(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT).resolves(true);
            executeCommandStub.withArgs(ExtensionCommands.REFRESH_ENVIRONMENTS).resolves();
            executeCommandStub.withArgs(ExtensionCommands.REFRESH_GATEWAYS).resolves();
            executeCommandStub.withArgs(ExtensionCommands.REFRESH_WALLETS).resolves();
            sendTelemetryEventStub = mySandBox.stub(Reporter.instance(), 'sendTelemetryEvent');
            deleteEnvironmentSpy = mySandBox.spy(FabricEnvironmentRegistry.instance(), 'delete');
        });

        afterEach(async () => {
            mySandBox.restore();
        });

        it('should test an environment can be added', async () => {
            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            const environments: Array<FabricEnvironmentRegistryEntry> = await FabricEnvironmentRegistry.instance().getAll();

            environments.length.should.equal(1);
            environments[0].should.deep.equal({
                name: 'myEnvironment'
            });

            executeCommandStub.should.have.been.calledWith(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT, sinon.match.instanceOf(FabricEnvironmentRegistryEntry));
            executeCommandStub.should.have.been.calledWith(ExtensionCommands.REFRESH_ENVIRONMENTS);

            deleteEnvironmentSpy.should.have.not.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.getCall(1).should.have.been.calledWith(LogType.SUCCESS, 'Successfully added a new environment');
            sendTelemetryEventStub.should.have.been.calledOnceWithExactly('addEnvironmentCommand');
        });

        it('should test multiple environments can be added', async () => {
            chooseNameStub.onFirstCall().resolves('myEnvironmentOne');

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            chooseNameStub.reset();
            chooseNameStub.onFirstCall().resolves('myEnvironmentTwo');

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            const environments: Array<FabricEnvironmentRegistryEntry> = await FabricEnvironmentRegistry.instance().getAll();

            environments.length.should.equal(2);
            environments[0].should.deep.equal({
                name: 'myEnvironmentOne'
            });

            environments[1].should.deep.equal({
                name: 'myEnvironmentTwo'
            });

            executeCommandStub.should.have.been.calledWith(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT, sinon.match.instanceOf(FabricEnvironmentRegistryEntry), true);
            executeCommandStub.should.have.been.calledWith(ExtensionCommands.REFRESH_ENVIRONMENTS);
            deleteEnvironmentSpy.should.have.not.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.getCall(1).should.have.been.calledWith(LogType.SUCCESS, 'Successfully added a new environment');
            logSpy.getCall(2).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.getCall(3).should.have.been.calledWith(LogType.SUCCESS, 'Successfully added a new environment');
            sendTelemetryEventStub.should.have.been.calledTwice;
            sendTelemetryEventStub.should.have.been.calledWithExactly('addEnvironmentCommand');
        });

        it('should handle cancel when choosing a method', async () => {
            showQuickPickItemStub.resolves();

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            await FabricEnvironmentRegistry.instance().exists('myEnvironment').should.eventually.equal(false);

            logSpy.callCount.should.equal(1);
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            sendTelemetryEventStub.should.not.have.been.calledOnceWithExactly('addEnvironmentCommand');
        });

        it('should test adding a environment can be cancelled when giving a environment name', async () => {
            chooseNameStub.onFirstCall().resolves();

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            const environments: Array<FabricEnvironmentRegistryEntry> = await FabricEnvironmentRegistry.instance().getAll();
            environments.length.should.equal(0);
            deleteEnvironmentSpy.should.have.not.been.called;
            logSpy.should.have.been.calledOnceWithExactly(LogType.INFO, undefined, 'Add environment');
            sendTelemetryEventStub.should.not.have.been.called;
        });

        it('should handle errors when adding nodes to an environment', async () => {
            const error: Error = new Error('some error');

            executeCommandStub.withArgs(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT).rejects(error);

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            const environments: Array<FabricEnvironmentRegistryEntry> = await FabricEnvironmentRegistry.instance().getAll();

            environments.length.should.equal(0);
            logSpy.should.have.been.calledTwice;
            deleteEnvironmentSpy.should.have.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.getCall(1).should.have.been.calledWith(LogType.ERROR, `Failed to add a new environment: ${error.message}`, `Failed to add a new environment: ${error.toString()}`);
            sendTelemetryEventStub.should.not.have.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.getCall(1).should.have.been.calledWith(LogType.ERROR, `Failed to add a new environment: ${error.message}`, `Failed to add a new environment: ${error.toString()}`);
            sendTelemetryEventStub.should.not.have.been.called;
        });

        it('should error if a environment with the same name already exists', async () => {
            const error: Error = new Error('An environment with this name already exists.');
            chooseNameStub.resolves('myEnvironmentOne');

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            const environments: Array<FabricEnvironmentRegistryEntry> = await FabricEnvironmentRegistry.instance().getAll();

            environments.length.should.equal(1);
            environments[0].should.deep.equal({
                name: 'myEnvironmentOne'
            });

            executeCommandStub.should.have.been.calledWith(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT, sinon.match.instanceOf(FabricEnvironmentRegistryEntry));
            executeCommandStub.should.have.been.calledWith(ExtensionCommands.REFRESH_ENVIRONMENTS);

            deleteEnvironmentSpy.should.have.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.getCall(1).should.have.been.calledWith(LogType.SUCCESS, 'Successfully added a new environment');
            logSpy.getCall(2).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.getCall(3).should.have.been.calledWith(LogType.ERROR, `Failed to add a new environment: ${error.message}`, `Failed to add a new environment: ${error.toString()}`);
            sendTelemetryEventStub.should.have.been.calledOnce;
        });

        it('should add environment but warn if nodes are not valid', async () => {
            executeCommandStub.withArgs(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT).resolves(false);

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            const environments: Array<FabricEnvironmentRegistryEntry> = await FabricEnvironmentRegistry.instance().getAll();

            environments.length.should.equal(1);
            environments[0].should.deep.equal({
                name: 'myEnvironment'
            });

            executeCommandStub.should.have.been.calledWith(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT, sinon.match.instanceOf(FabricEnvironmentRegistryEntry), true);
            executeCommandStub.should.have.been.calledWith(ExtensionCommands.REFRESH_ENVIRONMENTS);

            deleteEnvironmentSpy.should.have.not.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.should.have.been.calledWith(LogType.WARNING, 'Added a new environment, but some nodes could not be added');
            sendTelemetryEventStub.should.have.been.calledOnceWithExactly('addEnvironmentCommand');
        });

        it('should cancel environment creation if no nodes have been added', async () => {
            executeCommandStub.withArgs(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT).resolves(undefined);

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            const environments: Array<FabricEnvironmentRegistryEntry> = await FabricEnvironmentRegistry.instance().getAll();
            environments.length.should.equal(0);
            deleteEnvironmentSpy.should.have.been.called;
            logSpy.should.have.been.calledOnceWithExactly(LogType.INFO, undefined, 'Add environment');
            sendTelemetryEventStub.should.not.have.been.called;
        });

        it('should add a managed environment from an ansible dir', async () => {
            showQuickPickItemStub.resolves({data: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR});

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            const environments: Array<FabricEnvironmentRegistryEntry> = await FabricEnvironmentRegistry.instance().getAll();

            environments.length.should.equal(1);
            environments[0].should.deep.equal({
                name: 'myEnvironment',
                environmentDirectory: environmentDirectoryPath,
                managedRuntime: true,
                environmentType: EnvironmentType.ANSIBLE_ENVIRONMENT
            });

            executeCommandStub.should.not.have.been.calledWith(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT, sinon.match.instanceOf(FabricEnvironmentRegistryEntry));
            executeCommandStub.should.have.been.calledWith(ExtensionCommands.REFRESH_ENVIRONMENTS);
            executeCommandStub.should.have.been.calledWith(ExtensionCommands.REFRESH_GATEWAYS);
            executeCommandStub.should.have.been.calledWith(ExtensionCommands.REFRESH_WALLETS);

            deleteEnvironmentSpy.should.have.not.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.getCall(1).should.have.been.calledWith(LogType.SUCCESS, 'Successfully added a new environment');
            sendTelemetryEventStub.should.have.been.calledOnceWithExactly('addEnvironmentCommand');
        });

        it('should add a non managed environment from an ansible dir', async () => {
            showQuickPickItemStub.resolves({data: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR});

            environmentDirectoryPath = path.join(environmentDirectoryPath, '..', 'nonManagedAnsible');
            const uri: vscode.Uri = vscode.Uri.file(environmentDirectoryPath);

            openFileBrowserStub.resolves(uri);

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            const environments: Array<FabricEnvironmentRegistryEntry> = await FabricEnvironmentRegistry.instance().getAll();

            environments.length.should.equal(1);
            environments[0].should.deep.equal({
                name: 'myEnvironment',
                environmentDirectory: environmentDirectoryPath,
                environmentType: EnvironmentType.ANSIBLE_ENVIRONMENT
            });

            executeCommandStub.should.not.have.been.calledWith(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT, sinon.match.instanceOf(FabricEnvironmentRegistryEntry));
            executeCommandStub.should.have.been.calledWith(ExtensionCommands.REFRESH_ENVIRONMENTS);
            executeCommandStub.should.have.been.calledWith(ExtensionCommands.REFRESH_GATEWAYS);
            executeCommandStub.should.have.been.calledWith(ExtensionCommands.REFRESH_WALLETS);

            deleteEnvironmentSpy.should.have.not.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.getCall(1).should.have.been.calledWith(LogType.SUCCESS, 'Successfully added a new environment');
            sendTelemetryEventStub.should.have.been.calledOnceWithExactly('addEnvironmentCommand');
        });

        it('should handle cancel from choosing dir when adding from an ansible dir', async () => {
            showQuickPickItemStub.resolves({data: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR});

            openFileBrowserStub.resolves();

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            await FabricEnvironmentRegistry.instance().exists('myEnvironment').should.eventually.equal(false);

            logSpy.callCount.should.equal(1);
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            sendTelemetryEventStub.should.not.have.been.calledOnceWithExactly('addEnvironmentCommand');
        });

        it('should be able to add a new 1-org local network', async () => {
            const envName: string = 'New 1 Org Network';
            showQuickPickItemStub.onCall(0).resolves({data: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE});
            showQuickPickItemStub.onCall(1).resolves({data: UserInputUtil.ONE_ORG_TEMPLATE});

            showInputBoxStub.resolves(envName);
            const initializeStub: sinon.SinonStub = mySandBox.stub(LocalEnvironmentManager.instance(), 'initialize').resolves();

            const mockRuntime: sinon.SinonStubbedInstance<LocalEnvironment> = mySandBox.createStubInstance(LocalEnvironment);
            mockRuntime.getName.returns(envName);
            mockRuntime.generate.resolves();

            const getRuntimeStub: sinon.SinonStub = mySandBox.stub(LocalEnvironmentManager.instance(), 'getRuntime').resolves(mockRuntime);

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            showQuickPickItemStub.should.have.been.calledTwice;
            showQuickPickItemStub.getCall(0).should.have.been.calledWith('Select a method to add an environment', [{label: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE, data: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE, description: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE_DESCRIPTION}, {label: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR, data: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR, description: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR_DESCRIPTION}, {label: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES, data: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES, description: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES_DESCRIPTION}]);
            showQuickPickItemStub.getCall(1).should.have.been.calledWith('Choose a configuration for a new local network', [{label: UserInputUtil.ONE_ORG_TEMPLATE, data: UserInputUtil.ONE_ORG_TEMPLATE}, {label: UserInputUtil.TWO_ORG_TEMPLATE, data: UserInputUtil.TWO_ORG_TEMPLATE}, {label: UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS, data: UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS}]);
            showInputBoxStub.should.have.been.calledOnceWithExactly(`Provide a name for this Fabric Environment (avoid duplicating an existing name)`);
            initializeStub.should.have.been.calledWith(envName, 1);
            getRuntimeStub.should.have.been.calledOnceWith(envName);
            mockRuntime.generate.should.have.been.calledOnce;

            executeCommandStub.should.not.have.been.calledWith(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT, sinon.match.instanceOf(FabricEnvironmentRegistryEntry));

            deleteEnvironmentSpy.should.have.not.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.getCall(1).should.have.been.calledWith(LogType.SUCCESS, 'Successfully added a new environment');
            sendTelemetryEventStub.should.have.been.calledOnceWithExactly('addEnvironmentCommand');
        });

        it('should be able to add a new 2-org local network', async () => {
            const envName: string = 'New 2 Org Network';
            showQuickPickItemStub.onCall(0).resolves({data: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE});
            showQuickPickItemStub.onCall(1).resolves({data: UserInputUtil.TWO_ORG_TEMPLATE});

            showInputBoxStub.resolves(envName);
            const initializeStub: sinon.SinonStub = mySandBox.stub(LocalEnvironmentManager.instance(), 'initialize').resolves();

            const mockRuntime: sinon.SinonStubbedInstance<LocalEnvironment> = mySandBox.createStubInstance(LocalEnvironment);
            mockRuntime.getName.returns(envName);
            mockRuntime.generate.resolves();

            const getRuntimeStub: sinon.SinonStub = mySandBox.stub(LocalEnvironmentManager.instance(), 'getRuntime').resolves(mockRuntime);

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            showQuickPickItemStub.should.have.been.calledTwice;
            showQuickPickItemStub.getCall(0).should.have.been.calledWith('Select a method to add an environment', [{label: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE, data: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE, description: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE_DESCRIPTION}, {label: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR, data: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR, description: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR_DESCRIPTION}, {label: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES, data: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES, description: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES_DESCRIPTION}]);
            showQuickPickItemStub.getCall(1).should.have.been.calledWith('Choose a configuration for a new local network', [{label: UserInputUtil.ONE_ORG_TEMPLATE, data: UserInputUtil.ONE_ORG_TEMPLATE}, {label: UserInputUtil.TWO_ORG_TEMPLATE, data: UserInputUtil.TWO_ORG_TEMPLATE}, {label: UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS, data: UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS}]);

            showInputBoxStub.should.have.been.calledOnceWithExactly(`Provide a name for this Fabric Environment (avoid duplicating an existing name)`);
            initializeStub.should.have.been.calledWith(envName, 2);
            getRuntimeStub.should.have.been.calledOnceWith(envName);
            mockRuntime.generate.should.have.been.calledOnce;

            executeCommandStub.should.not.have.been.calledWith(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT, sinon.match.instanceOf(FabricEnvironmentRegistryEntry));

            deleteEnvironmentSpy.should.have.not.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.getCall(1).should.have.been.calledWith(LogType.SUCCESS, 'Successfully added a new environment');
            sendTelemetryEventStub.should.have.been.calledOnceWithExactly('addEnvironmentCommand');
        });

        it('should return when cancelling selecting a network configuration', async () => {
            showQuickPickItemStub.onCall(0).resolves({data: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE});
            showQuickPickItemStub.onCall(1).resolves();

            const initializeSpy: sinon.SinonSpy = mySandBox.spy(LocalEnvironmentManager.instance(), 'initialize');

            const getRuntimeSpy: sinon.SinonSpy = mySandBox.spy(LocalEnvironmentManager.instance(), 'getRuntime');

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            showQuickPickItemStub.should.have.been.calledTwice;
            showQuickPickItemStub.getCall(0).should.have.been.calledWith('Select a method to add an environment', [{label: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE, data: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE, description: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE_DESCRIPTION}, {label: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR, data: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR, description: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR_DESCRIPTION}, {label: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES, data: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES, description: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES_DESCRIPTION}]);
            showQuickPickItemStub.getCall(1).should.have.been.calledWith('Choose a configuration for a new local network', [{label: UserInputUtil.ONE_ORG_TEMPLATE, data: UserInputUtil.ONE_ORG_TEMPLATE}, {label: UserInputUtil.TWO_ORG_TEMPLATE, data: UserInputUtil.TWO_ORG_TEMPLATE}, {label: UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS, data: UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS}]);

            showInputBoxStub.should.not.have.been.calledOnceWithExactly(`Provide a name for this Fabric Environment (avoid duplicating an existing name)`);
            initializeSpy.should.not.have.been.called;
            getRuntimeSpy.should.not.have.been.called;

            executeCommandStub.should.not.have.been.calledWith(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT, sinon.match.instanceOf(FabricEnvironmentRegistryEntry));

            deleteEnvironmentSpy.should.have.not.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.should.not.have.been.calledWith(LogType.SUCCESS, 'Successfully added a new environment');
            sendTelemetryEventStub.should.not.have.been.calledOnceWithExactly('addEnvironmentCommand');
        });

        it('should open tutorial if user wants to learn about creating additional networks', async () => {
            showQuickPickItemStub.onCall(0).resolves({data: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE});
            showQuickPickItemStub.onCall(1).resolves({data: UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS});

            const initializeSpy: sinon.SinonSpy = mySandBox.spy(LocalEnvironmentManager.instance(), 'initialize');

            const getRuntimeSpy: sinon.SinonSpy = mySandBox.spy(LocalEnvironmentManager.instance(), 'getRuntime');

            await vscode.commands.executeCommand(ExtensionCommands.ADD_ENVIRONMENT);

            showQuickPickItemStub.should.have.been.calledTwice;
            showQuickPickItemStub.getCall(0).should.have.been.calledWith('Select a method to add an environment', [{label: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE, data: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE, description: UserInputUtil.ADD_ENVIRONMENT_FROM_TEMPLATE_DESCRIPTION}, {label: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR, data: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR, description: UserInputUtil.ADD_ENVIRONMENT_FROM_DIR_DESCRIPTION}, {label: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES, data: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES, description: UserInputUtil.ADD_ENVIRONMENT_FROM_NODES_DESCRIPTION}]);
            showQuickPickItemStub.getCall(1).should.have.been.calledWith('Choose a configuration for a new local network', [{label: UserInputUtil.ONE_ORG_TEMPLATE, data: UserInputUtil.ONE_ORG_TEMPLATE}, {label: UserInputUtil.TWO_ORG_TEMPLATE, data: UserInputUtil.TWO_ORG_TEMPLATE}, {label: UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS, data: UserInputUtil.CREATE_ADDITIONAL_LOCAL_NETWORKS}]);

            showInputBoxStub.should.not.have.been.calledOnceWithExactly(`Provide a name for this Fabric Environment (avoid duplicating an existing name)`);
            initializeSpy.should.not.have.been.called;
            getRuntimeSpy.should.not.have.been.called;

            executeCommandStub.should.not.have.been.calledWith(ExtensionCommands.IMPORT_NODES_TO_ENVIRONMENT, sinon.match.instanceOf(FabricEnvironmentRegistryEntry));

            const extPath: string = ExtensionUtil.getExtensionPath();
            const tutorialPath: string = path.join(extPath, 'packages', 'blockchain-extension', 'tutorials', 'developer-tutorials', 'create-additional-local-networks.md');

            const executeCallOne: sinon.SinonSpyCall = executeCommandStub.getCall(1);
            executeCallOne.should.have.been.calledWith('markdown.showPreview', sinon.match.any);
            executeCallOne.args[1].path.should.equal(tutorialPath);

            deleteEnvironmentSpy.should.have.not.been.called;
            logSpy.getCall(0).should.have.been.calledWith(LogType.INFO, undefined, 'Add environment');
            logSpy.should.not.have.been.calledWith(LogType.SUCCESS, 'Successfully added a new environment');
            sendTelemetryEventStub.should.not.have.been.calledOnceWithExactly('addEnvironmentCommand');
        });
    });
});
