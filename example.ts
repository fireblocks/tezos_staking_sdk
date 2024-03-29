import fs from "fs";
import path from "path";
import { FireblocksSDK } from "fireblocks-sdk";
import { setDelegate } from "./src/xtz-staker";


const apiSecret = fs.readFileSync(path.resolve(__dirname, "secret_key_path"), "utf8"); 
const apiKey = "api_key"; 
const fireblocks = new FireblocksSDK(apiSecret, apiKey);

//Consts for delegation:

// Tezos Public RPC url
const url: string = "https://rpc.tzbeta.net"; //testnet: https://ghostnet.ecadinfra.com
const destination: string = "baker_address";   
const vaultAccountId = 'vault_account_id'
const reveal = false;
const testnet = false;
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

setDelegate(fireblocks, url, destination, vaultAccountId, reveal, testnet);


