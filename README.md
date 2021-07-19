# Fireblocks Tezos Staking

**Prerequisites:** 

1. Enable RAW signing feature by contacting Fireblocks's support team

2. Set transaction authorization policy rule that governs the RAW signing operation, the policy should include the following parameters:

    a. Initiator

    b. Designated Signer

    c. Asset - XTZ

    d. Source (vault accounts) - Optional

    e. Authorizers - Optional

**How to stake XTZ:**

Run setDelegate(fireblocks, url, destination, vaultAccountId, reveal);

**Parameters:**

fireblocks = FireblocksSDK instance
url = JSON RPC URL (set by default, can be changed to any other URL)
destination = XTZ Baker address
vaultAccountId = vault account id of the XTZ wallet
reveal = if there is no any outgoing transaction were made out of this wallet - true, else - false
