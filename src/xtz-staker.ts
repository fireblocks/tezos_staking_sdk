import { OpKind,BlockHeaderResponse, OperationContentsTransaction, OperationContentsDelegation, OperationContentsReveal, OperationContents, BlockResponse, PendingOperationsV2, PendingOperationsV1 } from '@taquito/rpc';
import { TezosToolkit } from '@taquito/taquito';
import { FireblocksSDK, DepositAddressResponse } from "fireblocks-sdk";
import { FireblocksSigner } from './lib/FireblocksSigner';
import { ForgeParams } from '@taquito/taquito';
import { getBlockInfo, getDepositAddress, validateInputs, waitForConfirmation } from './lib/utils';

export async function setDelegate(
    apiClient: FireblocksSDK, 
    url: string, 
    destination: string, 
    vaultAccountId: string,
    reveal: boolean,
    testnet: boolean
): Promise<string>{

    const fbSigner: FireblocksSigner = new FireblocksSigner(apiClient, url, testnet);
    const Tezos: TezosToolkit = new TezosToolkit(url);
    
    console.log("Destination baker's address: " + destination);
    console.log("Vault account ID: " + vaultAccountId);
    console.log("Reveal: " + reveal);
    console.log("Testnet: " + testnet);

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
            return injectMsg;
        }catch(e){
            console.log(JSON.stringify(e, null, 2));
            throw e;
        }
    }catch(e){ 
        console.log("ForgeAndSign call error: " + e)
        throw e;
    }; 
}

export async function setStake(
    apiClient: FireblocksSDK,
    url: string,
    vaultAccountId: string,
    amount: string,
    testnet: boolean,
    awaitHash: string = ""
): Promise<string> {
    validateInputs(vaultAccountId, amount);

    const fbSigner = new FireblocksSigner(apiClient, url, testnet);
    const Tezos = new TezosToolkit(url);
    const sourceAddress = await getDepositAddress(apiClient, vaultAccountId, testnet);

    console.log("My XTZ wallet's address: " + sourceAddress);
    const amountMutez = (parseFloat(amount) * 1_000_000).toFixed(0);

    if (awaitHash) {
        console.log("Waiting for confirmation of the previous operation...");
        await waitForConfirmation(Tezos, awaitHash);
    }

    const { blockHash, counter } = await getBlockInfo(Tezos, sourceAddress);
    console.log("Block Hash: " + blockHash);

    const stakeOp: OperationContentsTransaction = {
        kind: OpKind.TRANSACTION,
        source: sourceAddress,
        fee: "1300",
        counter: (counter + 1).toString(),
        gas_limit: "10100",
        storage_limit: "0",
        amount: amountMutez,
        destination: sourceAddress,
        parameters: {
            entrypoint: "stake",
            value: { prim: "Unit" },
        },
    };

    const delegateShell: ForgeParams = {
        branch: blockHash,
        contents: [stakeOp],
    };

    try {
        const signedDelegateMsg = await fbSigner.forgeAndSign(delegateShell, vaultAccountId, sourceAddress);
        const injectMsg = await fbSigner.injectOperation(signedDelegateMsg);
        console.log("Successfully injected. Operation hash: " + injectMsg);
        return injectMsg;
    } catch (e) {
        console.error("Error during staking operation:", e);
        throw e;
    }
}

export async function setUnstake(
    apiClient: FireblocksSDK,
    url: string,
    vaultAccountId: string,
    amount: string,
    testnet: boolean,
    awaitHash: string = ""
): Promise<string> {
    validateInputs(vaultAccountId, amount);

    const fbSigner = new FireblocksSigner(apiClient, url, testnet);
    const Tezos = new TezosToolkit(url);
    const sourceAddress = await getDepositAddress(apiClient, vaultAccountId, testnet);

    console.log("My XTZ wallet's address: " + sourceAddress);
    const amountMutez = (parseFloat(amount) * 1_000_000).toFixed(0);

    if (awaitHash) {
        console.log("Waiting for confirmation of the previous operation...");
        await waitForConfirmation(Tezos, awaitHash);
    }

    const { blockHash, counter } = await getBlockInfo(Tezos, sourceAddress);
    console.log("Block Hash: " + blockHash);

    const unstakeOp: OperationContentsTransaction = {
        kind: OpKind.TRANSACTION,
        source: sourceAddress,
        fee: "1300",
        counter: (counter + 1).toString(),
        gas_limit: "10100",
        storage_limit: "0",
        amount: amountMutez,
        destination: sourceAddress,
        parameters: {
            entrypoint: "unstake",
            value: { prim: "Unit" },
        },
    };

    const delegateShell: ForgeParams = {
        branch: blockHash,
        contents: [unstakeOp],
    };

    try {
        const signedDelegateMsg = await fbSigner.forgeAndSign(delegateShell, vaultAccountId, sourceAddress);
        const injectMsg = await fbSigner.injectOperation(signedDelegateMsg);
        console.log("Successfully injected unstake operation. Operation hash: " + injectMsg);
        return injectMsg;
    } catch (e) {
        console.error("Error during unstaking operation:", e);
        throw e;
    }
}

export async function finalizeUnstake(
    apiClient: FireblocksSDK,
    url: string,
    vaultAccountId: string,
    testnet: boolean
): Promise<string> {
    validateInputs(vaultAccountId);

    const fbSigner = new FireblocksSigner(apiClient, url, testnet);
    const Tezos = new TezosToolkit(url);
    const sourceAddress = await getDepositAddress(apiClient, vaultAccountId, testnet);

    console.log("My XTZ wallet's address: " + sourceAddress);

    const { blockHash, counter } = await getBlockInfo(Tezos, sourceAddress);
    console.log("Block Hash: " + blockHash);

    const finalizeUnstakeOp: OperationContentsTransaction = {
        kind: OpKind.TRANSACTION,
        source: sourceAddress,
        fee: "1300",
        counter: (counter + 1).toString(),
        gas_limit: "10100",
        storage_limit: "0",
        amount: "0",
        destination: sourceAddress,
        parameters: {
            entrypoint: "finalize_unstake",
            value: { prim: "Unit" },
        },
    };

    const delegateShell: ForgeParams = {
        branch: blockHash,
        contents: [finalizeUnstakeOp],
    };

    try {
        const signedDelegateMsg = await fbSigner.forgeAndSign(delegateShell, vaultAccountId, sourceAddress);
        const injectMsg = await fbSigner.injectOperation(signedDelegateMsg);
        console.log("Successfully injected finalize unstake operation. Operation hash: " + injectMsg);
        return injectMsg;
    } catch (e) {
        console.error("Error during finalize unstake operation:", e);
        throw e;
    }
}