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
    const depositAddresses: DepositAddressResponse[] = await apiClient.getDepositAddresses(
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
    const counter: string = (await Tezos.rpc.getContract(sourceAddress)).counter;
    return {
        blockHash: blockHeader.hash,
        counter: parseInt(counter),
    };
}