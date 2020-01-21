Feature: Submit transaction
    Test submitting a transaction

    Scenario Outline: Submit a transaction for a smart contract (local fabric)
        Given a <language> smart contract for <assetType> assets with the name <name> and version <version>
        And the Local Fabric is running
        And the '1 Org Local Fabric' environment is connected
        And the 'Org1' wallet
        And the 'Local Fabric Admin' identity
        And I'm connected to the '1 Org Local Fabric - Org1' gateway
        And the contract has been created
        And the contract has been packaged
        And the package has been installed
        And the contract has been instantiated with the transaction '' and args '', not using private data on channel 'mychannel'
        When I submit the transaction 'createConga' with args '["Conga_001", "Big Conga"]'
        Then the logger should have been called with 'SUCCESS', 'Successfully submitted transaction' and 'No value returned from createConga'
        Examples:
        | language   | assetType | name               | version |
        | JavaScript | Conga     | JavaScriptContract | 0.0.1   |
        | TypeScript | Conga     | TypeScriptContract | 0.0.1   |
        | Java       | Conga     | JavaContract       | 0.0.1   |
        | Go         | null      | GoContract         | 0.0.1   |

    Scenario Outline: Submit a verify transaction for a private data smart contract
        Given a private <language> smart contract for <assetType> assets with the name <name> and version <version> and mspid <mspid>
        And the Local Fabric is running
        And the 'Local Fabric' environment is connected
        And the 'Org1' wallet
        And the 'Local Fabric Admin' identity
        And I'm connected to the 'Local Fabric - Org1' gateway
        And the private contract has been created
        And the private contract has been packaged
        And the private package has been installed
        And the contract has been instantiated with the transaction '' and args '', using private data on channel 'mychannel'
        When I submit the transaction 'createPrivateConga' with args '["001"]' and with the transient data '{"privateValue":"125"}'
        Then the logger should have been called with 'SUCCESS', 'Successfully submitted transaction' and 'No value returned from createPrivateConga'
        When I submit the transaction 'verifyPrivateConga' with args '["001", "{\"privateValue\":\"125\"}"]'
        Then the logger should have been called with 'SUCCESS', 'Successfully submitted transaction' and 'Returned value from verifyPrivateConga: true'
        Examples:
        | language   | assetType        | name                      | mspid      | version |
        # | JavaScript | PrivateConga     | PrivateJavaScriptContract | Org1MSP    | 0.0.1   |
        | TypeScript | PrivateConga     | PrivateTypeScriptContract | Org1MSP    | 0.0.1   |
        # | Java       | PrivateConga     | PrivateJavaContract       | Org1MSP    | 0.0.1   |
        # | Go         | null             | PrivateGoContract         | Org1MSP    | 0.0.1   |

    @otherFabric
    Scenario Outline: Submit a transaction for a smart contract (other fabric)
        Given an environment 'myFabric' exists
        And the wallet 'myWallet' with identity 'conga' and mspid 'Org1MSP' exists
        And the environment is setup
        And the 'myFabric' environment is connected
        And a <language> smart contract for <assetType> assets with the name <name> and version <version>
        And the contract has been created
        And the contract has been packaged
        And the package has been installed
        And the contract has been instantiated with the transaction '' and args '', not using private data on channel 'mychannel'
        And the gateway 'myGateway' is created
        And I'm connected to the 'myGateway' gateway without association
        When I submit the transaction 'createConga' with args '["Conga_001", "Big Conga"]'
        Then the logger should have been called with 'SUCCESS', 'Successfully submitted transaction' and 'No value returned from createConga'
        Examples:
        | language   | assetType | name               | version |
        | JavaScript | Conga     | JavaScriptContract | 0.0.1   |
        | Java       | Conga     | JavaContract       | 0.0.1   |
