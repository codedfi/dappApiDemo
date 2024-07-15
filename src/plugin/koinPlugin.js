import { Contract, utils } from 'koilib';
const MINTER_KOIN = '1ANdS4xE7bF2YM42LBvx6k6cnRhfeRX1NR'

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