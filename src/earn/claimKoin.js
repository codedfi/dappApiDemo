import { Contract, utils } from 'koilib';
import * as kondor from "kondor-js";

const koinAddress = '1PJ358hLg6GqywEW979wYoTapQnRYNwoYh'
const MINTER_KOIN = '15Rvm1urRjFSbviHD2fmXRN9BtB8RYiMUf'

const  getTransactionInfoByToken = async (amount, memo, provider, signer) => {
    const koinContract = new Contract({
        id: '18tWNU7E4yuQzz7hMVpceb9ixmaWLVyQsr',
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