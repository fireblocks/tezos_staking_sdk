# Fireblocks Tezos Staking

**Prerequisites:** 

1. Enable RAW signing feature by contacting Fireblocks' support team

2. Set transaction authorization policy rule that governs the RAW signing operation, the policy should include the following parameters:

    a. Initiator

    b. Designated Signer

    c. Asset - XTZ

    d. Source (vault accounts) - Optional

    e. Authorizers - Optional

**How to stake XTZ:**

Run - setDelegate(fireblocks, url, destination, vaultAccountId, reveal);

**How to unstake XTZ:**

In case you want to empty the entire XTZ balance:

 Run - setDelegate(fireblocks, url, "", vaultAccountId, reveal=false);

**Parameters:**

1. fireblocks = FireblocksSDK instance

2. url = JSON RPC URL (set by default, can be changed to any other URL)
 
3. destination = XTZ Baker address
 
4. vaultAccountId = vault account id of the XTZ wallet
 
5. reveal = if there is no any outgoing transaction were made out of this wallet - true, else - false

