# IBM Blockchain Extension for VSCode
<!---Installing instructions
--->
<!---Short description of what the extension allows the user to do and key features in bullet points below 
--->
The IBM Blockchain extension allows a user to easily write and test smart contract projects in Visual Studio Code:
* Generate skeleton smart contract projects
* Adds a Fabric view to connect and interact with Fabric Blockchain networks

## Features
The IBM Blockchain extension provides an explorer and commands accessible from the Command Palette, for developing smart contracts quickly:
<!---Table of commands with columns: 'command' and 'description'
--->

| Command | Description |
| --- | --- |
| Add Connection | Add a Hyperledger Fabric instance connection |
| Add Identity To Connection | Add an identity to be used when connecting to a Hyperledger Fabric instance  |
| Connect To Runtime | * -- Wait for changes |
| Create Smart Contract Package | Create a new smart contract package from a valid project|
| Create Smart Contract Project | Create a new JavaScript or TypeScript smart contract project |
| Delete Connection | Delete a Hyperledger Fabric instance connection |
| Delete Package | Delete a smart contract package |
| Disconnect From Runtime | * -- Wait for changes|
| Install Smart Contract | Install a smart contract package onto a peer |
| Instantiate Smart Contract | Instantiate an installed smart contract package |
| Refresh | * -- Wait for changes |
| Refresh Smart Contract Packages | * -- Wait for changes |
| Restart Fabric Runtime | Restart a Hyperledger Fabric instance |
| Start Fabric Runtime | Start a Hyperledger Fabric instance |
| Toggle Development Mode | Toggle the Hyperledger Fabric instance development mode |

## Smart Contract Development Lifecycle
<!---Things you can do in the Explorer view once the extension is installed
--->
### Create a new Fabric smart contract project
<!---Short explanation with code-blocks
--->

<img src="https://github.com/jakeeyturner/blockchain-vscode-extension/blob/issue-112/client/media/start_new_project.gif" width="85%" alt="Start a new Fabric smart contract project">
<!---Link to docs with further instructions
--->

### Edit / write smart contract files
<!---Short explanation with code-blocks
--->

<img src="https://github.com/jakeeyturner/blockchain-vscode-extension/blob/issue-112/client/media/edit_write_files.png" width="85%" alt="Edit smart contract files">
<!---Link to docs with further instructions
--->

### Create a package from a smart contract project
Coming in a later version. See [issue #2](https://github.ibm.com/IBM-Blockchain/fabric-vscode-extension/issues/2) 
<!---Short explanation with code-blocks
--->
<!---Screenshot of UI/Video of prototype click-through 
--->
<!---Link to docs with further instructions
--->

<!---Things you can do in the Fabric view once the extension is installed
--->
<!---Introduction to Fabric view
--->
### Connect to local_fabric runtime

<img src="https://github.com/Jakeeyturner/blockchain-vscode-extension/blob/issue-112/client/media/connect_to_local_fabric_runtime.gif" width="90%" alt="Connect to local_fabric runtime">

<!---Short explanation with code-blocks
--->
<!---Screenshot of UI/Video of prototype click-through 
--->
<!---Link to docs with further instructions
--->
### Connect to a specified (remote) Fabric runtime and discover the existing resources
<!---Short explanation with code-blocks
--->

<img src="https://github.com/jakeeyturner/blockchain-vscode-extension/blob/issue-112/client/media/discover_resources.png" width="40%" alt="Connect to the network and discover the existing resources">
<!---Link to docs with further instructions
--->

### Install new smart contract package
<!---Short explanation with code-blocks
--->

<img src="https://github.com/jakeeyturner/blockchain-vscode-extension/blob/issue-112/client/media/install_smart_contract.png" width="60%" alt="Install new smart contract">

<!---Link to docs with further instructions
--->

## Instantiate smart contract package
<!---Short explanation with code-blocks
--->

<img src="https://github.com/jakeeyturner/blockchain-vscode-extension/blob/issue-112/client/media/instantiate.gif" width="85%" alt="Instantiate new smart contract">


## Connecting to your own Hyperledger Fabric instance

Using this extension, you can connect to a pre-configured local instance of Hyperledger Fabric, or you can connect to your own Hyperledger Fabric instance. If you choose to connect to your own Fabric instance, it must be Fabric 1.3.0 or later.

**When using a local Hyperledger Fabric instance the extension will automatically pull and tag the required Docker images.**

To connect to your own Hyperledger Fabric instance within the extension, you must first pull and tag the Fabric 1.3.0 Docker images by running the following commands:

```
docker pull nexus3.hyperledger.org:10001/hyperledger/fabric-ca:amd64-1.3.0-stable
docker tag nexus3.hyperledger.org:10001/hyperledger/fabric-ca:amd64-1.3.0-stable hyperledger/fabric-ca

docker pull nexus3.hyperledger.org:10001/hyperledger/fabric-orderer:amd64-1.3.0-stable
docker tag nexus3.hyperledger.org:10001/hyperledger/fabric-orderer:amd64-1.3.0-stable hyperledger/fabric-orderer

docker pull nexus3.hyperledger.org:10001/hyperledger/fabric-peer:amd64-1.3.0-stable
docker tag nexus3.hyperledger.org:10001/hyperledger/fabric-peer:amd64-1.3.0-stable hyperledger/fabric-peer

docker pull nexus3.hyperledger.org:10001/hyperledger/fabric-tools:amd64-1.3.0-stable
docker tag nexus3.hyperledger.org:10001/hyperledger/fabric-tools:amd64-1.3.0-stable hyperledger/fabric-tools

docker pull nexus3.hyperledger.org:10001/hyperledger/fabric-ccenv:amd64-1.3.0-stable
docker tag nexus3.hyperledger.org:10001/hyperledger/fabric-ccenv:amd64-1.3.0-stable hyperledger/fabric-ccenv

```

## Supported Operating Systems 

Linux and Mac OS are currently the only supported operating systems for use with the extension.

The work to implement Windows support can be tracked in [Issue 72](https://github.com/IBM-Blockchain/blockchain-vscode-extension/issues/72).


## Telemetry Reporting

The extension uses telemetry reporting to track usage data and help improve future extension versions.

For instructions on how to disable telemetry reporting, please visit the visit the [Visual Studio Code FAQ](https://code.visualstudio.com/docs/supporting/FAQ#_how-to-disable-telemetry-reporting).

## Future Additions
To track the projects future features, visit [GitHub Issues](https://github.com/IBM-Blockchain/blockchain-vscode-extension/issues?q=is%3Aopen+is%3Aissue+label%3AEpic).

## License <a name="license"></a>
The source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the [LICENSE](LICENSE) file.
