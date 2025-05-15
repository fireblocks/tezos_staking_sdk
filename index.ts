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

const url: string = process.env.TEZOS_RPC_URL || "https://rpc.ghostnet.teztnets.com";
const destination: string = process.env.TEZOS_BAKER_ADDRESS                         //Destination baker's address (tz1...)
const vaultAccountId: string = process.env.FB_VAULT_ID                              //Vault account ID of the source wallet
const reveal : boolean = process.env.REVEAL_ADDRESS === "true" ? true : false;      //Reveal - "true" in case the source address should be revealed (No any historical outgoing transaction)
const testnet: boolean = url === "https://rpc.ghostnet.teztnets.com"; 
const stakeAmount: string = process.env.STAKE_AMOUNT || "0";                        //Only for stake/unstake, not for delegate/undelegate/finalize. Amount to stake (in tez) - 1 tez = 1_000_000 mutez

async function main() {
    let delegateHash: string = "";
    let stakeHash: string = "";

    let undelegateHash: string = "";
    let unstakeHash: string = "";

    delegateHash = await setDelegate(fireblocks, url, destination, vaultAccountId, reveal, testnet);
    stakeHash = await setStake(fireblocks, url, vaultAccountId, stakeAmount, testnet, delegateHash);
    
    /**
     * Unstaking and undelegating Operations
     * the unbonding period is 4-5 cycles (about 10-11 days), during which the funds are locked and cannot be used.
     * After the unbonding period, you can finalize the unstake operation.
     * To undelegate, pass null as destination
     */
    unstakeHash = await setUnstake(fireblocks, url, vaultAccountId, stakeAmount, testnet, stakeHash);
    undelegateHash = await setDelegate(fireblocks, url, null, vaultAccountId, false, testnet, unstakeHash);
    
    await finalizeUnstake(fireblocks, url, vaultAccountId, testnet);
    console.log("Undelegate/ unstaking operation completed successfully");
}

main()
    .then(() => {
        console.log("Staking/ Unstaking/ Delegation operation completed successfully");
    })
    .catch((error) => {
        console.error("Error during staking operation:", error);
    });
