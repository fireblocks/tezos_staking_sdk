# Fireblocks Tezos Staking

**Prerequisites:** 

1. Enable RAW signing feature by contacting Fireblocks' support team.

2. Set transaction authorization policy rule that governs the RAW signing operation. The policy should include the following parameters:
    - **Initiator**
    - **Designated Signer**
    - **Asset**: XTZ (XTZ_TEST in Ghostnet)
    - **Source (vault accounts)**: Optional
    - **Authorizers**: Optional

---

## Overview of Staking Flow

The Tezos staking flow involves the following steps:

1. **Delegate**: Assign a baker to manage staking for your account.
2. **Stake**: Lock a specific amount of XTZ for staking.
3. **Undelegate**: Remove the delegation by setting the delegate to `null`.
4. **Unstake**: Unlock the staked amount of XTZ.
5. **Finalize Unstake**: After the unbonding period (4-5 cycles, approximately 10-11 days), finalize the unstake operation to make the funds available.

---

## How to Stake XTZ

To stake XTZ, follow these steps:

1. **Delegate to a Baker**:
   ```typescript
   setDelegate(fireblocks, url, destination, vaultAccountId, reveal, testnet);


2. **Stake a specific amount to the delegated baker**:
   ```typescript
    setStake(
        fireblocks, 
        url, 
        vaultAccountId, 
        stakeAmount, 
        testnet, 
        delegateHash
    );

- **stakeAmount**: The amount to stake in tez 
- **deledateHash**: If delegation is called prior to stake, the stake delegation hash operation to wait for completion.

--

## How to Unstake XTZ

1. **Undelegate to a Baker**:
   ```typescript
    setDelegate(
        fireblocks, 
        url, 
        "", 
        vaultAccountId, 
        false, 
        testnet
    );

2. **Unstake the amount from the currently assigned Baker**:
   ```typescript
    setUnstake(
        fireblocks, 
        url, 
        vaultAccountId, 
        unstakeAmount, 
        testnet, 
        undelegateHash
    );

- **unstakeAmount**: The amount to unstake in tez 
- **undelegateHash**: The hash to wait for the undelegate operation to be processed prior to submitting the unstake

3. **Finalise the unstake operation**
   ```typescript
    finalizeUnstake(
        fireblocks, 
        url, 
        vaultAccountId, 
        testnet
    );

--

**.env Configuration Parameters:**

1. **FB_API_KEY**: Fireblocks API key (e.g., `"VVV-WWWW-XXX-YYY-ZZZ"`).

2. **FB_API_SECRET_FILE_PATH**: Path to the Fireblocks API secret key file (e.g., `./config/fireblocks-secret.key`).

3. **FB_VAULT_ID**: Vault account ID of the XTZ wallet (e.g., `"2"`).

4. **TEZOS_RPC_URL**: JSON RPC URL for the Tezos network (e.g., `"https://rpc.ghostnet.teztnets.com"` for Ghostnet).

5. **TEZOS_BAKER_ADDRESS**: XTZ Baker address (e.g., `"tz3ZmB8oWUmi8YZXgeRpgAcPnEMD8VgUa"`)