import { OpKind,BlockHeaderResponse } from '@taquito/rpc';
import { TezosToolkit } from '@taquito/taquito';
import { FireblocksSDK, DepositAddressResponse } from "fireblocks-sdk";
import { FireblocksSigner } from './FireblocksSigner';
import { ForgeParams } from '@taquito/taquito';

export async function setDelegate(
    apiClient: FireblocksSDK, 
    url: string, 
    destination: string, 
    vaultAccountId: string,
    reveal: boolean,
    testnet: boolean
): Promise<any>{

    const fbSigner: FireblocksSigner = new FireblocksSigner(apiClient, url, testnet);
    const Tezos: TezosToolkit = new TezosToolkit(url);
    
    const depositAddress: DepositAddressResponse[] = await apiClient.getDepositAddresses(vaultAccountId, testnet ? 'XTZ_TEST' : 'XTZ');
    const sourceAddress: string = depositAddress[0].address;
    
    console.log("My XTZ wallet's address: " + sourceAddress);
    
    //Suggested values for fee, gasLimit and storageLimit:
    const fee: string = "1300";
    const gasLimit: string = '10100';
    const storageLimit: string = '0';

    const counter: string = (await Tezos.rpc.getContract(sourceAddress)).counter;
    
    let revealCounter: number = parseInt(counter);
    revealCounter++;
    const delegateCounter = revealCounter + 1;
    
    const publicKey: string = await fbSigner.getPublicKey(vaultAccountId);
    
    const revealOp: any = {
        kind: OpKind.REVEAL,
        source: sourceAddress,
        fee: fee,
        counter: revealCounter.toString(),
        gas_limit: gasLimit,
        storage_limit: storageLimit,
        public_key: publicKey        //Public Key to reveal (in base58check format with 'edpk' prefix)
    }

    const delegateOp: any = {
        kind: OpKind.DELEGATION,
        source: sourceAddress,
        fee: fee,
        counter: reveal? delegateCounter.toString() : revealCounter.toString(),  //if reveal true - increased counter 
        gas_limit: gasLimit,
        storage_limit: storageLimit,
        delegate: destination 
    }
    
    const blockHeaderPromise: BlockHeaderResponse = await Tezos.rpc.getBlockHeader();
    const blockHash: string = blockHeaderPromise.hash;
    console.log("Block Hash: " + blockHash);

    const contentsList: any = [];
    
    if(reveal)
        contentsList.push(revealOp,delegateOp);
    else
        contentsList.push(delegateOp);
    
    const delegateShell: ForgeParams = {
        branch: blockHash.toString(),
        contents: contentsList
    };

    try{
        const signedDelegateMsg: string = await fbSigner.forgeAndSign(delegateShell, vaultAccountId, destination);
        try{
            const injectMsg: string = await fbSigner.injectOperation(signedDelegateMsg);
            console.log("Successfully injected. Operation hash: " + injectMsg);
        }catch(e){
            console.log(JSON.stringify(e, null, 2));
        }
    }catch(e){ 
        console.log("ForgeAndSign call error: " + e)
    }; 
}

