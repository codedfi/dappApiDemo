import { Contract, utils } from 'koilib';
const MINTER_KOIN = '15v4ML9VjjuJ2BMMoH1awGAYEnpCeESHaf'

class KoinPlugin {
    constructor() {}

    async getTransactionInfoByToken(contractAddress, amount, memo, provider, signer) {
        const koinContract = new Contract({
            id: contractAddress,
            abi: utils.tokenAbi,
            provider,
            signer,
        });
        const koin = koinContract.functions;
        const { transaction, receipt } = await koin.transfer({
            from: signer.getAddress(),
            to: MINTER_KOIN,
            value: amount,
            memo: memo
        });
        return transaction
    }

}

const koinPlugin = new KoinPlugin()

export default koinPlugin