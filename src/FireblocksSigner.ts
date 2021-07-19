import { 
    FireblocksSDK, 
    RawMessageData, 
    TransactionArguments, 
    SignedMessageResponse ,
    TransactionOperation, 
    PeerType, 
    TransactionStatus,  
    PublicKeyInfoForVaultAccountArgs,
} from "fireblocks-sdk";
import { HttpBackend } from '@taquito/http-utils';
import {
  b58cdecode,
  b58cencode,
  buf2hex,
  hex2buf,
  mergebuf,
  prefix,
} from '@taquito/utils';
import { localForger, LocalForger } from '@taquito/local-forging';
import { ForgeParams } from '@taquito/taquito';
import { OperationHash } from '@taquito/rpc/dist/types/types'
const sodium = require('libsodium-wrappers');

export class FireblocksSigner{
    
    apiClient: FireblocksSDK;
    url: any;
    httpBackend: HttpBackend;
  
    constructor(apiClient: FireblocksSDK, url: any) {
        
        this.apiClient = apiClient;
        this.url = url;
        this.httpBackend = new HttpBackend();
    }
  
    private createURL(path: string) {
        return `${this.url.replace(/\/+$/g, '')}${path}`;
    }
    
    async getPublicKey(vaultAccountId: string): Promise<string>{
        
        const change: number = 0;
        const addressIndex: number = 0;
        
        const publicKeyInfo: PublicKeyInfoForVaultAccountArgs = {
            assetId: 'XTZ',
            vaultAccountId: parseInt(vaultAccountId),
            change: change,
            addressIndex: addressIndex
        }
        
        const genericPubKey: string = (await this.apiClient.getPublicKeyInfoForVaultAccount(publicKeyInfo)).publicKey;
        const encodedPubKey: string = b58cencode(genericPubKey, prefix['edpk']); 

        return encodedPubKey;
    }
   
    async forgeAndSign(data: ForgeParams, vaultAccountId: string, destination: string): Promise<string>{
        
        const Forger: LocalForger = localForger;

        try{
            console.log("Message to forge:");
            console.log(data);
            
            let forgeRes: string = await Forger.forge(data);
            
            try{
                const signature: string = (await this.sign(destination, forgeRes, vaultAccountId, new Uint8Array([3]))).sbytes;
                return signature;
            }catch(e){
                console.log("Error in FireblocksSigner.sign: " + e);
            }
        }catch(e){
            console.log("Forger.forge error: " + e);
            
        }
     }
    
    
    async sign(destination: string, bytes: string, vaultAccountId: string, watermark: Uint8Array): Promise<any> {
        
        try {
            let bb: Uint8Array = hex2buf(bytes);
            if (typeof watermark !== 'undefined') {
                bb = mergebuf(watermark, bb);
            };
    
        const payloadHash: string = buf2hex(Buffer.from(sodium.crypto_generichash(32, bb)));
        
        const rawMessageData: RawMessageData = {
            messages: [{
                content: payloadHash
            }]
        }
        
        const tx: TransactionArguments = {
            operation: TransactionOperation.RAW,
            source: {
                type: PeerType.VAULT_ACCOUNT,
                id: vaultAccountId
            },
            assetId: 'XTZ',
            note: "Delegating Tezos to the following Baker's address: " + destination,
            extraParameters: { rawMessageData }
        }
        
        const txId: string = (await this.apiClient.createTransaction(tx)).id;
        console.log('Raw signing transaction submitted. Transaction ID: ' + txId);

        let status = await this.apiClient.getTransactionById(txId);

        while (status.status != TransactionStatus.COMPLETED) {
            if(status.status == TransactionStatus.BLOCKED || status.status == TransactionStatus.FAILED || status.status == TransactionStatus.REJECTED || status.status == TransactionStatus.CANCELLED){
                console.log("Transaction's status: " + status.status + ". Substatus: " + status.subStatus);
                
                throw Error("Exiting the operation");
            }
            console.log((await this.apiClient.getTransactionById(txId)).status);
            setTimeout(() => { }, 1000);
            
            status = await this.apiClient.getTransactionById(txId);
        }

        const signedTx: SignedMessageResponse[] = (await this.apiClient.getTransactionById(txId)).signedMessages;
        const signature: string = signedTx[0].signature.fullSig;
        const prefixSig: any = b58cencode(signature, prefix.edsig)
        const sigDecoded: Uint8Array = b58cdecode(prefixSig, prefix.edsig);
        const sigToInject: string = buf2hex(Buffer.from(sigDecoded));
        
        console.log("Signature to inject: " + sigToInject);
        console.log("RAW Response:");
        console.log(signedTx);
        
        return {
            bytes,
            sig: signature,
            prefixSig: prefixSig,
            sbytes: bytes + sigToInject
        };
        }catch(e) {
            console.log(e);
        } 
    };
    
    async injectOperation(signedOpBytes: string): Promise<OperationHash> {
        return this.httpBackend.createRequest<any>(
          {
            url: this.createURL(`/injection/operation`),
            method: 'POST',
          },
          signedOpBytes
        );
      }
    };


    