import fs from "fs";
import path from "path";
import { FireblocksSDK } from "fireblocks-sdk";
import { setDelegate, setStake, setUnstake, finalizeUnstake } from "./src/xtz-staker";

require("dotenv").config();

const apiSecret = fs.readFileSync(path.resolve(__dirname, process.env.FB_API_SECRET_FILE_PATH), "utf8"); 
const apiKey = process.env.FB_API_KEY || ""; //Fireblocks API Key

let errorMessage = "";

if (!apiKey) {
    errorMessage += "FB_API_KEY is not set\n";
}
if (!apiSecret) {
    errorMessage += "FB_API_SECRET_FILE_PATH is not set\n";
}
if (!process.env.TEZOS_BAKER_ADDRESS) {
    errorMessage += "TEZOS_BAKER_ADDRESS is not set\n";
}
if (!process.env.FB_VAULT_ID) {
    errorMessage += "FB_VAULT_ID is not set\n";
}
if (errorMessage) {
    console.error(errorMessage);
    process.exit(1);
}

const fireblocks = new FireblocksSDK(
    apiSecret, 
    apiKey,
);

//Consts for delegation:

// Tezos Public RPC url
const url: string = process.env.TEZOS_RPC_URL || "https://rpc.ghostnet.teztnets.com";
const destination: string = process.env.TEZOS_BAKER_ADDRESS //Destination baker's address (tz1...)
const vaultAccountId: string = process.env.FB_VAULT_ID //Vault account ID of the source wallet
const reveal : boolean = process.env.REVEAL_ADDRESS === "true" ? true : false; //Reveal - "true" in case the source address should be revealed (No any historical outgoing transaction)
const testnet: boolean = url === "https://rpc.ghostnet.teztnets.com"; 
const stakeAmount: string = process.env.STAKE_AMOUNT || "0"; //Only for stake, not for delegate. Amount to stake (in tez) - 1 tez = 1_000_000 mutez
/* Set Delegate Operation: 
   
Params: 
    1. FireblocksSDK instance
    2. Tezos public RPC url
    3. Destination baker's address (tz1...)
    4. Vault account ID of the source 
    5. Reveal - "true" in case the source address should be revealed (No any historical outgoing transaction) 
    6. Testnet - "true" in case using testnet.
    
    NOTE: "REVEAL" should be done only on the FIRST OUTGOING source wallet's staking operation!
   
    NOTE: For undelegate - pass empty string as destination 
*/

async function main() {
    let delegateHash: string = "";
    let stakeHash: string = "";
    let unstakeHash: string = "";

    delegateHash = await setDelegate(fireblocks, url, destination, vaultAccountId, reveal, testnet);
    stakeHash = await setStake(fireblocks, url, vaultAccountId, stakeAmount, testnet, delegateHash);
    unstakeHash = await setUnstake(fireblocks, url, vaultAccountId, stakeAmount, testnet, stakeHash);
    
    // the unbonding period is 4-5 cycles (about 10-11 days), during which the funds are locked and cannot be used.
    // After the unbonding period, you can finalize the unstake operation.
    //await finalizeUnstake(fireblocks, url, vaultAccountId, testnet);
    console.log("Staking operation completed successfully");
}

main()
    .then(() => {
        console.log("Staking operation completed successfully");
    })
    .catch((error) => {
        console.error("Error during staking operation:", error);
    });
