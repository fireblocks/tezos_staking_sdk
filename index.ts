import fs from "fs";
import path from "path";
import { FireblocksSDK } from "fireblocks-sdk";
import { setDelegate } from "./src/xtz-staker";


const apiSecret = fs.readFileSync(path.resolve(__dirname, "/Users/slavaserebriannyi/api_keys/fireblocks_secret.key"), "utf8"); //demo_api1 key: /Users/slavaserebriannyi/fireblocks-demo-api-user2.key
const apiKey = "f704b8d8-29d2-5ce9-9e15-4a3ad29e585a"; //Slava Workspace user: f704b8d8-29d2-5ce9-9e15-4a3ad29e585a
const fireblocks = new FireblocksSDK(apiSecret, apiKey);

//Consts for delegation:
const url: string = "https://rpc.tzbeta.net/"; // Tezos Public RPC url
const destination: string = "tz1fPKAtsYydh4f1wfWNfeNxWYu72TmM48fu";   //BlockDaemon's baker address
const vaultAccountId = '0'
const reveal = false;
/* Set Delegate Operation: 
   
Params: 
    1. FireblocksSDK instance
    2. Tezos public RPC url
    3. Source wallet address (tz1...)
    4. Destination baker's address (tz1...)
    5. Vault account ID of the source 
    6. Reveal - "true" in case the source address should be revealed. 
    
    NOTE: "REVEAL" should be done only on the FIRST OUTGOING source wallet's operation!
   
    NOTE: For undelegate - pass empty string as destination 
*/

setDelegate(fireblocks, url, destination, vaultAccountId, reveal);


