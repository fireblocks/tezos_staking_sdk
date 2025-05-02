import { FireblocksSDK, DepositAddressResponse } from "fireblocks-sdk";
import { TezosToolkit } from "@taquito/taquito";
import { BlockHeaderResponse } from "@taquito/rpc";

/**
 * Validate input parameters for staking/unstaking operations.
 */
export function validateInputs(vaultAccountId: string, amount?: string): void {
    if (!vaultAccountId) {
        throw new Error("Vault account ID is required");
    }
    if (amount !== undefined) {
        if (!amount) {
            throw new Error("Amount is required");
        }
        if (isNaN(parseFloat(amount))) {
            throw new Error("Amount must be a number");
        }
        if (parseFloat(amount) <= 0) {
            throw new Error("Amount must be greater than 0");
        }
    }
}

/**
 * Fetch the deposit address for the given vault account.
 */
export async function getDepositAddress(
    apiClient: FireblocksSDK,
    vaultAccountId: string,
    testnet: boolean
): Promise<string> {
    const depositAddresses: DepositAddressResponse[] =
        await apiClient.getDepositAddresses(
            vaultAccountId,
            testnet ? "XTZ_TEST" : "XTZ"
        );
    return depositAddresses[0].address;
}

/**
 * Fetch the current block hash and counter for the source address.
 */
export async function getBlockInfo(
    Tezos: TezosToolkit,
    sourceAddress: string
): Promise<{ blockHash: string; counter: number }> {
    const blockHeader: BlockHeaderResponse = await Tezos.rpc.getBlockHeader();
    const counter: string = (await Tezos.rpc.getContract(sourceAddress))
        .counter;
    return {
        blockHash: blockHeader.hash,
        counter: parseInt(counter),
    };
}

/**
 * Wait for a transaction to be confirmed.
 */
export async function waitForConfirmation(
    Tezos: TezosToolkit,
    operationHash: string
): Promise<void> {
    // Wait for a new block to be produced in the event reveal and delegate operations are also called
    let block = await Tezos.rpc.getBlock();
    let initialBlockHeight = block.header.level;
    let blockHeight = block.header.level;
    let confirmed = false;

    while (operationHash) {
        let block = await Tezos.rpc.getBlock();
        if (block.header.level == blockHeight) {
            console.log("Waiting for new block...");
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
            continue;
        }
        blockHeight = block.header.level;
        if (!confirmed) {
            const allOperations = block.operations.flat();
            if (allOperations.find((op) => op.hash === operationHash)) {
                console.log("Operation confirmed in block: " + blockHeight);
                confirmed = true;
            }
        }
        if (blockHeight - initialBlockHeight > 5) {
            if (confirmed) {
                break;
            } else {
                throw new Error("Operation not confirmed in 5 blocks");
            }
        }
        console.log("Waiting 1 second for operation to be confirmed...");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
    }
}
