Feature: Fabric Environments
    Tests all the features of the fabric ops panel

    Scenario Outline: There should be a tree item (disconnected)
        Given the Local Fabric is running
        Then there should be a tree item with a label '<label>' in the 'Fabric Environments' panel
        And the tree item should have a tooltip equal to '<tooltip>'
        Examples:
        | label                  | tooltip                                  |
        | Local Fabric  ●        | The local development runtime is running |

    Scenario Outline: There should be a tree item (connected)
        Given the Local Fabric is running
        And the '1 Org Local Fabric' environment is connected
        Then there should be a <treeItem> tree item with a label '<label>' in the 'Fabric Environments' panel
        And the tree item should have a tooltip equal to '<tooltip>'
        Examples:
        | treeItem                    | label                                  | tooltip                                                                      |
        | environment connected       | Connected to environment: Local Fabric | Connected to environment: Local Fabric                                       |
        | installed smart contract    | + Install                              | + Install                                                                    |
        | instantiated smart contract | + Instantiate                          | + Instantiate                                                                |
        | Channels                    | mychannel                              | Associated peers: Org1Peer1                                                          |
        | Node                        | Org1Peer1                              | Name: Org1Peer1\\nMSPID: Org1MSP\\nAssociated Identity:\\norg1Admin |
        | Node                        | OrdererCA                              | Name: OrdererCA\\nAssociated Identity:\\nadmin |
        | Node                        | Org1CA                    | Name: Org1CA\\nAssociated Identity:\\nadmin                      |
        | Node                        | Orderer                    | Name: Orderer\\nMSPID: OrdererMSP\\nAssociated Identity:\\nordererAdmin |
        | Organizations               | OrdererMSP                             | OrdererMSP                                                                   |
        | Organizations               | Org1MSP                                | Org1MSP                                                                      |

     Scenario Outline: It should open the terminal
         Given the Local Fabric is running
         And the '1 Org Local Fabric' environment is connected
         When I open the terminal for node '<nodeType>'
         Then there should be a terminal open
         Examples:
         | nodeType       |
         | fabric-peer    |
         | fabric-ca      |
         | fabric-orderer |

     Scenario Outline: It should persist data after being stopped
         Given the Local Fabric is running
         And the '1 Org Local Fabric' environment is connected
         And a <language> smart contract for <assetType> assets with the name <name> and version <version>
         And the contract has been created
         And the contract has been packaged
         And the package has been installed
         And the contract has been instantiated with the transaction '' and args '', not using private data on channel 'mychannel'
         When I stop the Local Fabric
         Then there should be a tree item with a label '<label>' in the 'Fabric Environments' panel
         Then the tree item should have a tooltip equal to '<tooltip>'
         When I start the Local Fabric
         And the '1 Org Local Fabric' environment is connected
         Then there should be a instantiated smart contract tree item with a label '<instantiatedName>' in the 'Fabric Environments' panel
         Examples:
         | language   | assetType | name               | instantiatedName         | version | label                            | tooltip                                                                    |
         | JavaScript | Conga     | JavaScriptContract | JavaScriptContract@0.0.2 | 0.0.2   | Local Fabric  ○ (click to start) | Creates a local development runtime using Hyperledger Fabric Docker images |

     Scenario Outline: After teardown and start there are no smart contracts
         Given the Local Fabric is running
         And the '1 Org Local Fabric' environment is connected
         And a <language> smart contract for <assetType> assets with the name <name> and version <version>
         And the contract has been created
         And the contract has been packaged
         And the package has been installed
         And the contract has been instantiated with the transaction '' and args '', not using private data on channel 'mychannel'
         When I teardown the Local Fabric
         Then there should be a tree item with a label 'Local Fabric  ○ (click to start)' in the 'Fabric Environments' panel
         Examples:
         | language   | assetType | name               | version |
         | JavaScript | Conga     | JavaScriptContract | 0.0.2   |


     @otherFabric
     Scenario: It should create an environment
         When I create an environment 'myFabric'
         Then there should be a tree item with a label 'myFabric' in the 'Fabric Environments' panel
         And the tree item should have a tooltip equal to 'myFabric'

     @otherFabric
     Scenario Outline: It should setup environment
         Given an environment 'myFabric' exists
         And the wallet 'myWallet' with identity 'conga' and mspid 'Org1MSP' exists
         When I connect to the environment 'myFabric'
         Then there should be a tree item with a label '<label>' in the 'Fabric Environments' panel
         And the tree item should have a tooltip equal to '<tooltip>'
         Examples:
         | label                              | tooltip                            |
         | Setting up: myFabric               | Setting up: myFabric               |
         | (Click each node to perform setup) | (Click each node to perform setup) |
         | ca.example.com   ⚠                 | ca.example.com                     |
         | orderer.example.com   ⚠            | orderer.example.com                |
         | peer0.org1.example.com   ⚠         | peer0.org1.example.com             |

     @otherFabric
     Scenario Outline: It should associate nodes with identities
         Given an environment 'myFabric' exists
         And the wallet 'myWallet' with identity 'conga' and mspid 'Org1MSP' exists
         And the 'myFabric' environment is connected
         When I associate identity '<identity>' in wallet '<wallet>' with node '<name>'
         Then the log should have been called with 'SUCCESS' and 'Successfully associated identity <identity> from wallet <wallet> with node <name>'
         Examples:
         | name                    | wallet   | identity |
         | peer0.org1.example.com  | myWallet | conga    |
         | orderer.example.com     | myWallet | conga    |
         | ca.example.com          | myWallet | conga2   |


    @otherFabric
    Scenario Outline: It should connect to an environment
        Given an environment 'myFabric' exists
        And the wallet 'myWallet' with identity 'conga' and mspid 'Org1MSP' exists
        And the environment is setup
        When I connect to the environment 'myFabric'
        Then there should be a <treeItem> tree item with a label '<label>' in the 'Fabric Environments' panel
        And the tree item should have a tooltip equal to '<tooltip>'
        Examples:
        | treeItem                    | label                              | tooltip                                                                      |
        | environment connected       | Connected to environment: myFabric | Connected to environment: myFabric                                           |
        | installed smart contract    | + Install                          | + Install                                                                    |
        | instantiated smart contract | + Instantiate                      | + Instantiate                                                                |
        | Channels                    | mychannel                          | Associated peers: peer0.org1.example.com                                                          |
        | Node                        | peer0.org1.example.com             | Name: peer0.org1.example.com\\nMSPID: Org1MSP\\nAssociated Identity:\\nconga |
        | Node                        | ca.example.com                     | Name: ca.example.com\\nAssociated Identity:\\nconga2                         |
        | Node                        | orderer.example.com                | Name: orderer.example.com\\nMSPID: OrdererMSP\\nAssociated Identity:\\nconga |
        | Organizations               | OrdererMSP                         | OrdererMSP                                                                   |
        | Organizations               | Org1MSP                            | Org1MSP                                                                      |

    @otherFabric
    Scenario Outline: It should instantiate a smart contract
        Given an environment 'myFabric' exists
        And the wallet 'myWallet' with identity 'conga' and mspid 'Org1MSP' exists
        And the environment is setup
        And the 'myFabric' environment is connected
        And a <language> smart contract for <assetType> assets with the name <name> and version <version>
        And the contract has been created
        And the contract has been packaged
        And the package has been installed
        When I instantiate the installed package with the transaction '' and args '', not using private data on channel 'mychannel'
        Then there should be a instantiated smart contract tree item with a label '<instantiatedName>' in the 'Fabric Environments' panel
        And the tree item should have a tooltip equal to 'Instantiated on: mychannel'
        Examples:
        | language   | assetType | name               | instantiatedName         | version |
        | JavaScript | Conga     | JavaScriptContract | JavaScriptContract@0.0.1 | 0.0.1   |

    @otherFabric
    Scenario Outline: It should upgrade a smart contract
        Given an environment 'myFabric' exists
        And the wallet 'myWallet' with identity 'conga' and mspid 'Org1MSP' exists
        And the environment is setup
        And the 'myFabric' environment is connected
        And a <language> smart contract for <assetType> assets with the name <name> and version <version>
        And the contract has been created
        And the contract has been packaged
        And the package has been installed
        And the contract has been instantiated with the transaction '' and args '', not using private data on channel 'mychannel'
        And the contract version has been updated to '0.0.2'
        And the contract has been packaged
        And the package has been installed
        When I upgrade the installed package with the transaction '' and args '', not using private data on channel 'mychannel'
        Then there should be a instantiated smart contract tree item with a label '<upgradedName>' in the 'Fabric Environments' panel
        And the tree item should have a tooltip equal to 'Instantiated on: mychannel'
        Examples:
        | language   | assetType | name               | upgradedName              | version |
        | JavaScript | Conga     | JavaScriptContract | JavaScriptContract@0.0.2  | 0.0.1   |
        | Java       | Conga     | JavaContract       | JavaContract@0.0.2        | 0.0.1   |


    @otherFabric
    Scenario: It should delete a node
        Given an environment 'myFabric2' exists
        And the wallet 'myWallet' with identity 'conga' and mspid 'Org1MSP' exists
        And the environment is setup
        And the 'myFabric2' environment is connected
        When I delete node 'ca.example.com'
        Then there shouldn't be a Node tree item with a label 'ca.example.com' in the 'Fabric Environments' panel
        And there should be a Node tree item with a label 'peer0.org1.example.com' in the 'Fabric Environments' panel

    @otherFabric
    Scenario: It should delete an environment
        Given an environment 'myFabric2' exists
        When I delete an environment 'myFabric2'
        Then there shouldn't be a tree item with a label 'myFabric2' in the 'Fabric Environments' panel

    @ansibleFabric
     Scenario: It should create an environment
         When I create an environment 'myAnsibleFabric'
         Then there should be a tree item with a label 'myAnsibleFabric' in the 'Fabric Environments' panel
         And the tree item should have a tooltip equal to 'myAnsibleFabric'  

    @ansibleFabric
    Scenario Outline: It should connect to an environment
        Given an environment 'myAnsibleFabric' exists
        When I connect to the environment 'myAnsibleFabric'
        Then there should be a <treeItem> tree item with a label '<label>' in the 'Fabric Environments' panel
        And the tree item should have a tooltip equal to '<tooltip>'
        Examples:
        | treeItem                    | label                                     | tooltip                                                                  |
        | environment connected       | Connected to environment: myAnsibleFabric | Connected to environment: myAnsibleFabric                                |
        | installed smart contract    | + Install                                 | + Install                                                                |
        | instantiated smart contract | + Instantiate                             | + Instantiate                                                            |
        | Channels                    | channel1                                  | Associated peers: Org1Peer1, Org1Peer2, Org2Peer1, Org2Peer2             |
        | Node                        | Org1Peer1                                 | Name: Org1Peer1\\nMSPID: Org1MSP\\nAssociated Identity:\\norg1Admin      |
        | Node                        | Org1Peer2                                 | Name: Org1Peer2\\nMSPID: Org1MSP\\nAssociated Identity:\\norg1Admin      |
        | Node                        | Org2Peer1                                 | Name: Org2Peer1\\nMSPID: Org2MSP\\nAssociated Identity:\\norg2Admin      |
        | Node                        | Org2Peer2                                 | Name: Org2Peer2\\nMSPID: Org2MSP\\nAssociated Identity:\\norg2Admin      |
        | Node                        | OrdererCA                                 | Name: OrdererCA\\nAssociated Identity:\\nadmin                          |
        | Node                        | Org1CA                                    | Name: Org1CA\\nAssociated Identity:\\nadmin                              |
        | Node                        | Org2CA                                    | Name: Org2CA\\nAssociated Identity:\\nadmin                              |
        | Node                        | Orderer1                                  | Name: Orderer1\\nMSPID: OrdererMSP\\nAssociated Identity:\\nordererAdmin |
        | Organizations               | OrdererMSP                                | OrdererMSP                                                               |
        | Organizations               | Org1MSP                                   | Org1MSP                                                                  |
        | Organizations               | Org2MSP                                   | Org2MSP                                                                  |

    @ansibleFabric
    Scenario Outline: It should instantiate a smart contract
        Given an environment 'myAnsibleFabric' exists
        And the 'myAnsibleFabric' environment is connected
        And a <language> smart contract for <assetType> assets with the name <name> and version <version>
        And the contract has been created
        And the contract has been packaged
        And the package has been installed
        When I instantiate the installed package with the transaction '' and args '', not using private data on channel 'channel1'
        Then there should be a instantiated smart contract tree item with a label '<instantiatedName>' in the 'Fabric Environments' panel
        And the tree item should have a tooltip equal to 'Instantiated on: channel1'
        Examples:
        | language   | assetType | name               | instantiatedName         | version |
        | TypeScript | Conga     | TypeScriptContract | TypeScriptContract@0.0.1 | 0.0.1   |

    @ansibleFabric
    Scenario Outline: It should upgrade a smart contract
        Given an environment 'myAnsibleFabric' exists
        And the 'myAnsibleFabric' environment is connected
        And a <language> smart contract for <assetType> assets with the name <name> and version <version>
        And the contract has been created
        And the contract has been packaged
        And the package has been installed
        And the contract has been instantiated with the transaction '' and args '', not using private data on channel 'channel1'
        And the contract version has been updated to '0.0.2'
        And the contract has been packaged
        And the package has been installed
        When I upgrade the installed package with the transaction '' and args '', not using private data on channel 'channel1'
        Then there should be a instantiated smart contract tree item with a label '<upgradedName>' in the 'Fabric Environments' panel
        And the tree item should have a tooltip equal to 'Instantiated on: channel1'
        Examples:
        | language   | assetType | name               | upgradedName              | version |
        | TypeScript | Conga     | TypeScriptContract | TypeScriptContract@0.0.2  | 0.0.1   |

    @ansibleFabric
    Scenario: It should delete an environment
        Given an environment 'myAnsibleFabric2' exists
        When I delete an environment 'myAnsibleFabric2'
        Then there shouldn't be a tree item with a label 'myAnsibleFabric2' in the 'Fabric Environments' panel
    
