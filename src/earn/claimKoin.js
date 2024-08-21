import { Contract, utils } from 'koilib';
import * as kondor from "kondor-js";

const koinAddress = '1PJ358hLg6GqywEW979wYoTapQnRYNwoYh'
const MINTER_KOIN = '16CYYThq1ud7jZUgVk2Vj9xrfWsu7i3Nw9'

const  getTransactionInfoByToken = async (amount, memo, provider, signer) => {
    const koinContract = new Contract({
        id: '15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL',
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

const claimNow = async () => {
    const provider = kondor.getProvider()
    const signer = kondor.getSigner(koinAddress)
    try {
      let transactionInfo = null
      transactionInfo = await getTransactionInfoByToken(0, 'USDT_1000000:KOIN_10000000', provider, signer)
      if(!transactionInfo) return false
      const hash = transactionInfo.id
    } catch(error) {

    }
}

// example
// claimNow()