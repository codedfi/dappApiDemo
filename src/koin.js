import { formatUnits, parseUnits } from 'ethers'
import koinPlugin from "./plugin/koinPlugin.js"
import * as kondor from "kondor-js";
import BigNumber from 'bignumber.js';
import { getAggregateQuote, getAggregateSwap, getAssets, getBridgeQuote, getChain } from './api.js';

const koinAddress = '1PJ358hLg6GqywEW979wYoTapQnRYNwoYh'
const toAddress = '0x42a6685ef29886Cbcb595Aa903f00dea0d1787d8'
const channelFeeRate = '30'

let supportChainList = []
let supportTokenList = []
const initData = async() => {
    const chains = await getChain()
    const tokens = await getAssets()

    supportChainList = chains
    supportTokenList = tokens
}

// Example 1: bridget
// KOIN/KOIN => KOIN/FSN bridge
const fnTestBridget = async () => {
    await initData()
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

    let tokenContractAddress = KOINTokenForKOIN.address
    if (tokenContractAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        tokenContractAddress = '15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL'
    }
    
    const channel = 'chainge'
    const toChain = 'FSN' // here is FSN
    const toTokenAddress = KOINTokenForFSN.address
    const toAddr = toAddress
    const slippage = '0'

    const shortOrderStr = `${channel}:${toChain}:${toTokenAddress}:${toAddr}:${slippage}:${extra}`
    const orderHex = shortOrderStr

    console.log(3333, orderHex)

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
// KOIN/KOIN => FSN/USDT,  All non-cross-chain transactions can be routed to the mode
const fnTestAggregate = async () => {
    await initData()
    // This information can be obtained through the getAssets APIs.
    const KOINTokenForKOIN = {
      index: '46',
      symbol: 'KOIN',
      decimals: 8,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      burnable: false
    }


    const USDTTokenForFsn = {
      index: '5',
      symbol: 'USDT',
      decimals: 6,
      address: '0x8a20c13b42d7fe418f10f922f2cee06246c24269',
      burnable: false
    }
    const fromAmount = '100'
    const amount = parseUnits(fromAmount, KOINTokenForKOIN.decimals).toString()
    const params = {
        fromAmount: amount,
        fromTokenAddress: KOINTokenForKOIN.address,
        fromDecimal: KOINTokenForKOIN.decimals,
        fromChain: 'KOIN',
        toTokenAddress: USDTTokenForFsn.address,
        toDecimal: USDTTokenForFsn.decimals,
        toChain: 'FSN',
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
    const receiveAmountForExtra = parseUnits(receiveAmountHr, USDTTokenForFsn.decimals).toString()

    // Computed minimum, After calculating the minimum value, we need to convert it to the decimals of the target chain.
    const miniAmount = BigNumber(receiveAmountHr).multipliedBy(BigNumber((1 - (slippage * 0.01)))).toFixed(USDTTokenForFsn.decimals)
    const miniAmountForExtra = parseUnits(miniAmount, USDTTokenForFsn.decimals).toString()

    // 1_Expected value;2_Third party profit ratio;3_version;4_Mini Amount;5_Execution chain
    const extra = `1_${receiveAmountForExtra};2_${channelFeeRate};3_2;4_${miniAmountForExtra};5_${executionChainObj.nickName}`


    let tokenContractAddress = KOINTokenForKOIN.address
    if (tokenContractAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        tokenContractAddress = '15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL'
    }

    const channel = 'chainge'
    const toChain = 'BNB' // here is BNB
    const toTokenAddress = USDTTokenForFsn.address
    const toAddr = toAddress

    // But it needs to be converted to a scale of ten thousand points in the resulting parameter
    const slippageFormat = slippage * 0.01 * 10000
    const shortOrderStr = `${channel}:${toChain}:${toTokenAddress}:${toAddr}:${slippageFormat}:${extra}`
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
