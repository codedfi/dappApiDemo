// It's an example from CUSDT on KAS to PEPE on KAS

import BigNumber from 'bignumber.js';
import { formatUnits, hexlify, parseUnits, toUtf8Bytes } from 'ethers'
import { getAggregateQuote,  getChain } from '../api.js';

const fromAddress = 'kaspa:qzg4g46sd3hnax9fnjqdc2jfljs39f9ng00ntfhdz28rfwyc8adzuksnutgrq'
const toAddress = 'kaspa:qzg4g46sd3hnax9fnjqdc2jfljs39f9ng00ntfhdz28rfwyc8adzuksnutgrq'
const publicKey = '03915457506c6f3e98a99c80dc2a49fca112a4b343df35a6ed128e34b8983f5a2e'
const wallet = {} // The kasWare wallet object.

const channelFeeRate = '0'
// This information can be obtained through the getAssets APIs.
const fromTokenForKAS = {
    index: '18',
    symbol: 'KAS',
    decimals: 8,
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
}

const toTokenForKAS = {
    index: '103',
    symbol: 'PEPE',
    decimals: 8,
    address: 'PEPE'
}

// init base data
let supportChainList = []
const initData = async() => {
    const chains = await getChain()
    supportChainList = chains
}


const fromAmount = '100'
const amount = parseUnits(fromAmount, fromTokenForKAS.decimals).toString()
let extra = ''
let customSlippage = '5' // percentage format, ex: 5%
let toExpectAmount = ''

const fnGetAggregateQuote = async () => {
    const quoteParams = {
        fromAmount: amount,
        fromTokenAddress: fromTokenForKAS.address,
        fromDecimal: fromTokenForKAS.decimals,
        fromChain: 'KAS',
        toTokenAddress: toTokenForKAS.address,
        toDecimal: toTokenForKAS.decimals,
        toChain: 'KAS',
        channelFeeRate: channelFeeRate,
    }

    // quote 
    const quoteResult = await getAggregateQuote(quoteParams)
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
    const receiveAmountHrRound = BigNumber(receiveAmountHr).toFixed(toTokenForKAS.decimals, BigNumber.ROUND_DOWN)
    const receiveAmountForExtra = parseUnits(receiveAmountHrRound, toTokenForKAS.decimals).toString()


    // Computed minimum, After calculating the minimum value, we need to convert it to the decimals of the target chain.
    // The slippage here is in percentage format. 
    // The slippage returned by this interface is our recommended value, but you can set your own slippage.
    const tempSlippage = customSlippage || slippage
    const miniAmount = BigNumber(receiveAmountHr).multipliedBy(BigNumber((1 - (tempSlippage * 0.01)))).toFixed(toTokenForKAS.decimals, BigNumber.ROUND_DOWN)
    const miniAmountForExtra = parseUnits(miniAmount, toTokenForKAS.decimals).toString()

    // 1_Expected value;2_Third party profit ratio;3_version;4_Mini Amount;5_Execution chain
    extra = `1_${receiveAmountForExtra};2_${channelFeeRate};3_2;4_${miniAmountForExtra};5_${executionChainObj.nickName}`
    customSlippage = tempSlippage
    toExpectAmount = receiveAmountForExtra
}

const fnSubmitOrder = async (tradeHash) => {
    const sourceCertsObj = {
        fromAmount: amount,
        fromIndex: fromTokenForKAS.index.toString(),
        fromChain: 'KAS',    
        fromAddr: fromAddress,
        certHash: tradeHash,
        fromPublicKey: publicKey,
        signature: "123456",
    };
    const sourceCertsStr = JSON.stringify(sourceCertsObj);
    let sourceCertsHex = hexlify(toUtf8Bytes(sourceCertsStr));
    sourceCertsHex = sourceCertsHex.substring(2);

    // The slippage here needs to be converted to basis points (1/10,000).
    let slippageNumBI = BigNumber(customSlippage)
    const formatSlippage = slippageNumBI.multipliedBy(BigNumber(100)).toFixed(0)
    const params = {
        "sourceCerts": sourceCertsHex,
        "orderType": "2",
        "toIndex": toTokenForKAS.index.toString(),
        "toChain": "KAS",
        "toAddr": toAddress,
        "slippage": formatSlippage,
        "execStrategy": "",
        "extra": extra,
        "triggerPrice": "0",
        "timeout": "0",
        "channel": "chainge" // your channel
    }
    let raw = `${sourceCertsObj.certHash}_${sourceCertsObj.fromChain}_${sourceCertsObj.fromIndex}_${sourceCertsObj.fromAmount}_${params.toChain}_${params.toIndex}_${toExpectAmount}_${params.toAddr}`

    // Use the signMessage method of the kasWare wallet to sign a string.
    // let signature = wallet.signMessage(raw)
    let signature = ''

    const header = {
        Address: fromAddress,
        PublicKey: publicKey,
        Chain: 'KAS',
        Signature: signature
    }

    const response = await fetch('https://api2.chainge.finance/v1/submitOrder', {
        method: "POST",
        headers: {
             "Content-Type": "application/json",
             ...header
        },
        body: JSON.stringify(params)
    })
    const result = await response.json()
}


const fnCore = async () => {
    // step 1: init base data
    await initData()

    // step 2: quote 
    await fnGetAggregateQuote()

    // step 3: quote 
    // You need to initiate a transaction to our minter through the wallet, and obtain the hash. This hash will be the transaction hash.
    // const txHash = await wallet.signKRC20Transaction()
    const txHash = ''

    // step 4: submitOrder
    await fnSubmitOrder(txHash)
}

fnCore()


// NOTE:
// We have three minter addresses; make sure to distinguish between them when using them.

// fromToken is KAS use:   kaspa:qpgmt2dn8wcqf0436n0kueap7yx82n7raurlj6aqjc3t3wm9y5ssqtg9e4lsm

// fromToken in CUSDT/CUSDC/CETH/CBTC/CXCHNG use: kaspa:qpy03sxk3z22pacz2vkn2nrqeglvptugyqy54xal2skha6xh0cr7wjueueg79

// other KRC20 TOKEN use: kaspa:qz9cqmddjppjyth8rngevfs767m5nvm0480nlgs5ve8d6aegv4g9xzu2tgg0u