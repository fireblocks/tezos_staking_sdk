import { OpKind,BlockHeaderResponse, OperationContentsTransaction, OperationContentsDelegation, OperationContentsReveal, OperationContents } from '@taquito/rpc';
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
    
    const revealOp: OperationContentsReveal = {
        kind: OpKind.REVEAL,
        source: sourceAddress,
        fee: fee,
        counter: revealCounter.toString(),
        gas_limit: gasLimit,
        storage_limit: storageLimit,
        public_key: publicKey        //Public Key to reveal (in base58check format with 'edpk' prefix)
    }

    const delegateOp: OperationContentsDelegation = {
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

    const contents: OperationContents[] = [];
    
    if(reveal)
        contents.push(revealOp,delegateOp);
    else
        contents.push(delegateOp);
    
    const delegateShell: ForgeParams = {
        branch: blockHash.toString(),
        contents
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

/**
 * @description Set the delegated funds to a staking 
 * Requires reveal and delegate operations prior to the staking operation
 * 
 * @param apiClient 
 * @param url 
 * @param vaultAccountId 
 * @param amount
 * @param testnet 
 */

export async function setStake(
    apiClient: FireblocksSDK, 
    url: string, 
    vaultAccountId: string,
    amount: string,
    testnet: boolean,
): Promise<String>{
    const fbSigner: FireblocksSigner = new FireblocksSigner(apiClient, url, testnet);
    const Tezos: TezosToolkit = new TezosToolkit(url);
    
    const depositAddress: DepositAddressResponse[] = await apiClient.getDepositAddresses(vaultAccountId, testnet ? 'XTZ_TEST' : 'XTZ');
    const sourceAddress: string = depositAddress[0].address;
    
    console.log("My XTZ wallet's address: " + sourceAddress);
    const amountMutez = typeof amount === 'string' ? amount : (parseFloat(amount) * 1_000_000).toFixed(0);

    //Suggested values for fee, gasLimit and storageLimit:
    const fee: string = "1300";
    const gasLimit: string = '10100';
    const storageLimit: string = '0';

    const counter: string = (await Tezos.rpc.getContract(sourceAddress)).counter;
    const blockHeaderPromise: BlockHeaderResponse = await Tezos.rpc.getBlockHeader();
    const blockHash: string = blockHeaderPromise.hash;
    console.log("Block Hash: " + blockHash);

    let nonce: number = parseInt(counter);
    nonce++;
    
    const publicKey: string = await fbSigner.getPublicKey(vaultAccountId);

    /**
     * @description OperationContentsTransaction as a regular transfer instruction
     * @param kind - OperationKind.TRANSACTION
     * @param destination - A self-transfer to the same addresss
     */
    const stakeOp: OperationContentsTransaction = {
        kind: OpKind.TRANSACTION,
        source: sourceAddress,
        fee: fee,
        counter: nonce.toString(),
        gas_limit: gasLimit,
        storage_limit: storageLimit,
        amount,
        destination: sourceAddress, // staking is a self-transfer
        parameters: {
            entrypoint: "stake",
            value: {
                prim: "Unit",
            }
        }
    }

    const contents: OperationContents[] = [stakeOp];

    const delegateShell: ForgeParams = {
        branch: blockHash.toString(),
        contents
    };
    
    let injectMsg: string = "";

    try{
        const signedDelegateMsg: string = await fbSigner.forgeAndSign(delegateShell, vaultAccountId, sourceAddress);
        try{
            injectMsg = await fbSigner.injectOperation(signedDelegateMsg);
            console.log("Successfully injected. Operation hash: " + injectMsg);
        }catch(e){
            console.log(JSON.stringify(e, null, 2));
        }
    }catch(e){ 
        console.log("ForgeAndSign call error: " + e)
    }; 
    
    return injectMsg;
}

export async function unstake() {

}


export async function finalizeUnstake() {

}
