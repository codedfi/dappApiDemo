import koinPlugin from "./plugin/koinPlugin.js"
import * as kondor from "kondor-js";

const koinAddress = '1PJ358hLg6GqywEW979wYoTapQnRYNwoYh'
const toAddress = '0x42a6685ef29886Cbcb595Aa903f00dea0d1787d8'
const channelFeeRate = '30'

// Example 1: bridget
// KOIN/KOIN => KOIN/FSN bridge
const fnTestBridget = async () => {
    // This information can be obtained through the getAssets APIs.
    const KOINTokenForKOIN = {
        index: '46',
        symbol: 'KOIN',
        decimals: 8,
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        burnable: false
    }

    const KOINTokenForFSN = {
        index: '46',
        symbol: 'KOIN',
        decimals: 8,
        address: '0x75de9735e7d90b6232a081331c46ab089c105eaf',
        burnable: true
    }
    const fromAmount = '1'
    const amount = parseUnits(fromAmount, KOINTokenForKOIN.decimals).toString()
    const params = {
        amount: amount,
        symbol: 'KOIN',
        fromChain: 'KOIN',
        toChain: 'FSN',
        channelFeeRate: channelFeeRate, // The third-party fee
    }
    // quote 
    const quoteResult = await getBridgeQuote(params)
    if(quoteResult.code !== 0) return
    const { outAmount, serviceFee, gasFee } = quoteResult.data
    
    const receiveAmount = BigInt(outAmount) - BigInt(serviceFee) - BigInt(gasFee)
    if(receiveAmount <= BigInt(0)) {
        // The current quote amount cannot cover the fees. Please enter a larger amount.
        return
    }
    const receiveAmountStr = receiveAmount.toString()

    // 1_Expected value;2_Third party profit ratio;3_version;4_Mini Amount;5_Execution chain
    // In the current example, KOIN is being bridged from the KOIN chain to the FSN chain, so the value of 5 should be 5_FSN.
    const extra = `1_${receiveAmountStr};2_${channelFeeRate};3_2;4_${receiveAmountStr};5_FSN`

    // submit order 
    const sourceCerts = {
        fromAmount: amount,
        fromIndex: KOINTokenForKOIN.index, // KOIN
        fromChain: 'KOIN',
        fromAddr: koinAddress,
        certHash: '',
        fromPublicKey: '', // default
        signature: '123456' // default '123456'
    }

    const sourceCertsStr= JSON.stringify(sourceCerts)
    let sourceCertsForHex = hexlify(toUtf8Bytes(sourceCertsStr))
    sourceCertsForHex = sourceCertsForHex.substring(2)

    let tokenContractAddress = KOINTokenForKOIN.address
    if (tokenContractAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        tokenContractAddress = '15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL'
    }

    const bodyParams = {
        channel: "chainge", // Your unique identity, Apply to us for your exclusive channel
        extra: extra,
        orderType: '1', // 1, bridage
        slippage: '0', 
        sourceCerts: sourceCertsForHex, 
        toChain: 'FSN',
        toIndex: KOINTokenForFSN.index,
        toAddr: toAddress,
        execStrategy: "", // default ''
        timeout: "0",   // default '0'
        triggerPrice: "0", // default '0'
    }
    const shortOrderStr = `${bodyParams.channel}:${bodyParams.toChain}:${bodyParams.toIndex}:${bodyParams.toAddr}:${bodyParams.slippage}:${bodyParams.extra}`
    const orderHex = shortOrderStr

    const provider = kondor.getProvider()
    const signer = kondor.getSigner(koinAddress)
    try {
      let transactionInfo = null
      transactionInfo = await koinPlugin.getTransactionInfoByToken(tokenContractAddress, amount, orderHex, provider, signer)
      if(!transactionInfo) return false
      const hash = transactionInfo.id

      const params = {
        chain: 'KOIN',
        hash: hash
      }
      const idResult = await getOrderIdByHash(params)
      if(idResult.code === 0) {
        const orderId = idResult.data.id
      }
    } catch(error) {

    }
}

// Example 2: Aggregate
// KOIN/KOIN => BNB/BNB,  All non-cross-chain transactions can be routed to the mode
const fnTestAggregate = async () => {
    // This information can be obtained through the getAssets APIs.
    const KOINTokenForKOIN = {
        index: '46',
        symbol: 'KOIN',
        decimals: 8,
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        burnable: false
    }


    const BNBTokenForBnb = {
        index: '124',
        symbol: 'BNB',
        decimals: 18,
        address: '0x4b0f1812e5df2a09796481ff14017e6005508003',
        burnable: false
    }
    const fromAmount = '1'
    const amount = parseUnits(fromAmount, KOINTokenForKOIN.decimals).toString()
    const params = {
        fromAmount: amount,
        fromTokenAddress: KOINTokenForKOIN.address,
        fromDecimal: KOINTokenForKOIN.decimals,
        fromChain: 'KOIN',
        toTokenAddress: BNBTokenForBnb.address,
        toDecimal: BNBTokenForBnb.decimals,
        toChain: 'BNB',
        channelFeeRate: channelFeeRate,
    }
    // quote 
    const quoteResult = await getAggregateQuote(params)
    if(quoteResult.code !== 0) return
    const { chain, chainDecimal, outAmount, serviceFee, gasFee, slippage } = quoteResult.data

    const receiveAmount = BigInt(outAmount) - BigInt(serviceFee) - BigInt(gasFee)
    if(receiveAmount <= BigInt(0)) {
        // The current quote amount cannot cover the fees. Please enter a larger amount.
        return
    }
    // execution Chain Info
    const executionChainObj = supportChainList.find((item) => item.network === chain)

    // Calculate the value the user should receive. 
    const receiveAmountHr = formatUnits(receiveAmount, chainDecimal)
    const receiveAmountForExtra = parseUnits(receiveAmountHr, BNBTokenForBnb.decimals).toString()

    // Computed minimum, After calculating the minimum value, we need to convert it to the decimals of the target chain.
    const miniAmount = BigNumber(receiveAmountHr).multipliedBy(BigNumber((1 - (slippage * 0.01)))).toString()
    const miniAmountForExtra = parseUnits(miniAmount, BNBTokenForBnb.decimals).toString()

    // 1_Expected value;2_Third party profit ratio;3_version;4_Mini Amount;5_Execution chain
    const extra = `1_${receiveAmountForExtra};2_${channelFeeRate};3_2;4_${miniAmountForExtra};5_${executionChainObj.nickName}`


    // submit order 
    const sourceCerts = {
        fromAmount: amount,
        fromIndex: KOINTokenForKOIN.index, // eth
        fromChain: 'KOIN',
        fromAddr: koinAddress,
        certHash: '',
        fromPublicKey: '', // default
        signature: '123456' // default '123456'
    }

    const sourceCertsStr= JSON.stringify(sourceCerts)
    let sourceCertsForHex = hexlify(toUtf8Bytes(sourceCertsStr))
    sourceCertsForHex = sourceCertsForHex.substring(2)

    let tokenContractAddress = KOINTokenForKOIN.address
    if (tokenContractAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        tokenContractAddress = '15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL'
    }

    const bodyParams = {
        channel: "chainge", // Your unique identity
        extra: extra,
        orderType: '2', // 2, aggregate
        slippage: slippage, 
        sourceCerts: sourceCertsForHex, 
        toChain: 'BNB',
        toIndex: BNBTokenForBnb.index,
        toAddr: toAddress,
        execStrategy: "",
        timeout: "0",
        triggerPrice: "0",
    }
    const shortOrderStr = `${bodyParams.channel}:${bodyParams.toChain}:${bodyParams.toIndex}:${bodyParams.toAddr}:${bodyParams.slippage}:${bodyParams.extra}`
    const orderHex = shortOrderStr

    const provider = kondor.getProvider()
    const signer = kondor.getSigner(koinAddress)

    try {
      let transactionInfo = null
      transactionInfo = await koinPlugin.getTransactionInfoByToken(tokenContractAddress, amount, orderHex, provider, signer)
      if(!transactionInfo) return false
      const hash = transactionInfo.id

      const params = {
        chain: 'KOIN',
        hash: hash
      }
      const idResult = await getOrderIdByHash(params)
      if(idResult.code === 0) {
        const orderId = idResult.data.id
      }
    } catch(error) {

    }
}
