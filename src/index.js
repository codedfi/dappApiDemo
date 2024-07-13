import BigNumber from 'bignumber.js';
import { MaxUint256, ethers, formatUnits, hexlify, parseUnits, toUtf8Bytes } from 'ethers'
import { getAggregateQuote, getAggregateSwap, getAssets, getBridgeQuote } from './api';
import abi from './abi'

//The following example demonstrates how to use the ethers library to sign a transaction. This code can only run in a browser. Please adapt it to your specific situation:
const userAddress = '0x42a6685ef29886Cbcb595Aa903f00dea0d1787d8'

// Third-party transaction fee.
// The third-party fee ranges from 0.1% to 0.5%, expressed in basis points.
const channelFeeRate = '30'

let supportChainList = []
let supportTokenList = []
const initData = async() => {
    const chains = await getChain()
    const tokens = await getAssets()

    supportChainList = chains
    supportTokenList = tokens
}
initData()

const getProvider = () => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    return provider
}
  
const getSigner = async () => {
    const provider = getProvider()
    const signer = await provider.getSigner();
    return signer
}

const tokenApprove = async (tokenInfo, v2ContractAddress) => {
    try {
        const { address: tokenAddress  } = tokenInfo
        if(tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            return true
        } else {
            const provider = await getProvider()
            const readContract = new ethers.Contract(tokenAddress, abi, provider)
            const allowance = await readContract.allowance(userAddress, v2ContractAddress)
            if(allowance > BigInt(0)) {
                return true
            } else {
                const signer = await getSigner()
                const writeContract = new ethers.Contract(tokenAddress, abi, signer)
                const approve = await writeContract.approve(v2ContractAddress, MaxUint256)
                await approve.wait();
                return true
            }
        }
    } catch(error) {
    }
}

// Example 1: bridget
// ETH/ETH => BNB/ETH bridge
const fnTestBridget = async () => {
    // This information can be obtained through the getChain APIs,(builtInMinterProxyV2)
    const v2ContractForETH = '0x4c5f53015f3adb1b1d15ddf4e17edaae6fa185a5'

    // This information can be obtained through the getAssets APIs.
    const ETHTokenForEth = {
        index: '4',
        symbol: 'ETH',
        decimals: 18,
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        burnable: false
    }

    const ETHTokenForBnb = {
        index: '4',
        symbol: 'ETH',
        decimals: 18,
        address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
        burnable: false
    }
    const fromAmount = '1'
    const amount = parseUnits(fromAmount, ETHTokenForEth.decimals).toString()
    const params = {
        amount: amount,
        symbol: 'ETH',
        fromChain: 'ETH',
        toChain: 'BNB',
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
    // In the current example, ETH is being bridged from the ETH chain to the BNB chain, so the value of 5 should be 5_BNB.
    const extra = `1_${receiveAmountStr};2_${channelFeeRate};3_2;4_${receiveAmountStr};5_BNB`

    // submit order 
    const sourceCerts = {
        fromAmount: amount,
        fromIndex: ETHTokenForEth.index, // eth
        fromChain: 'ETH',
        fromAddr: userAddress,
        certHash: '',
        fromPublicKey: '', // default
        signature: '123456' // default '123456'
    }

    const sourceCertsStr= JSON.stringify(sourceCerts)
    let sourceCertsForHex = hexlify(toUtf8Bytes(sourceCertsStr))
    sourceCertsForHex = sourceCertsForHex.substring(2)

    const bodyParams = {
        channel: "chainge", // Your unique identity, Apply to us for your exclusive channel
        extra: extra,
        orderType: '1', // 1, bridage
        slippage: '0', 
        sourceCerts: sourceCertsForHex, 
        toChain: 'BNB',
        toIndex: ETHTokenForBnb.index,
        toAddr: userAddress,
        execStrategy: "", // default ''
        timeout: "0",   // default '0'
        triggerPrice: "0", // default '0'
    }
    const orderParamsHex = hexlify(toUtf8Bytes(JSON.stringify(bodyParams)))
    let value = '0'
    // Check if it is the native currency.
    if(ETHTokenForEth.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        value = amount
    }
    const isApproved = await tokenApprove(ETHTokenForEth, v2ContractForETH)
    if(!isApproved) return false

    const signer = await getSigner()
    const writeContract = new ethers.Contract(v2ContractForETH, abi, signer)
    const options = {value: value}
    const result = await writeContract.vaultOut(ETHTokenForEth.address, amount, ETHTokenForEth.burnable, orderParamsHex, options)
}

// Example 2: Aggregate
// ETH/ETH => BNB/BNB or ETH/ETH => USDT/ETH,  All non-cross-chain transactions can be routed to the mode
const fnTestAggregate = async () => {
    // This information can be obtained through the getChain APIs,(builtInMinterProxyV2)
    const v2ContractForETH = '0x4c5f53015f3adb1b1d15ddf4e17edaae6fa185a5'

    // This information can be obtained through the getAssets APIs.
    const ETHTokenForEth = {
        index: '4',
        symbol: 'ETH',
        decimals: 18,
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
    const amount = parseUnits(fromAmount, ETHTokenForEth.decimals).toString()
    const params = {
        fromAmount: amount,
        fromTokenAddress: ETHTokenForEth.address,
        fromDecimal: ETHTokenForEth.decimals,
        fromChain: 'ETH',
        toTokenAddress: BNBTokenForBnb.address,
        toDecimal: BNBTokenForBnb.decimals,
        toChain: 'BNB',
        channelFeeRate: '30',
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
        fromIndex: ETHTokenForEth.index, // eth
        fromChain: 'ETH',
        fromAddr: userAddress,
        certHash: '',
        fromPublicKey: '', // default
        signature: '123456' // default '123456'
    }

    const sourceCertsStr= JSON.stringify(sourceCerts)
    let sourceCertsForHex = hexlify(toUtf8Bytes(sourceCertsStr))
    sourceCertsForHex = sourceCertsForHex.substring(2)

    const bodyParams = {
        channel: "chainge", // Your unique identity
        extra: extra,
        orderType: '2', // 2, aggregate
        slippage: slippage, 
        sourceCerts: sourceCertsForHex, 
        toChain: 'BNB',
        toIndex: BNBTokenForBnb.index,
        toAddr: userAddress,
        execStrategy: "",
        timeout: "0",
        triggerPrice: "0",
    }
    const orderParamsHex = hexlify(toUtf8Bytes(JSON.stringify(bodyParams)))
    let value = '0'
    // Check if it is the native currency.
    if(ETHTokenForEth.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        value = amount
    }
    const isApproved = await tokenApprove(ETHTokenForEth, v2ContractForETH)
    if(!isApproved) return false
    const signer = await getSigner()
    const writeContract = new ethers.Contract(v2ContractForETH, abi, signer)
    const options = {value: value}
    const result = await writeContract.vaultOut(ETHTokenForEth.address, amount, ETHTokenForEth.burnable, orderParamsHex, options)
}

// Example 3: direct swap
// BNB/USDT => BNB/USDC  In the case of the same chain, please use this mode.
const fnTestSwap = async () => {
    // This information can be obtained through the getAssets APIs.
    const USDTTokenForBnb = {
        index: '5',
        symbol: 'USDT',
        decimals: 18,
        address: '0x55d398326f99059ff775485246999027b3197955',
        burnable: false
    }

    const USDCTokenForBnb = {
        index: '6',
        symbol: 'USDC',
        decimals: 18,
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        burnable: false
    }

    const fromAmount = '5'
    const amount = parseUnits(fromAmount, USDTTokenForBnb.decimals).toString()
    const params = {
        fromAmount: amount,
        fromTokenAddress: USDTTokenForBnb.address,
        fromDecimal: USDTTokenForBnb.decimals,
        fromChain: 'BNB',
        toTokenAddress: USDCTokenForBnb.address,
        toDecimal: USDCTokenForBnb.decimals,
        toChain: 'BNB',
        channelFeeRate: '30',
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
  
    // If the execution chain is not the chain you selected.
    if(executionChainObj.nickName !== 'BNB') {
        // likely method fnTestAggregate

        // This information can be obtained through the getChain APIs,(builtInMinterProxyV2)
        const v2ContractForBNB = '0x99a57ac044e6ce44b7e161a07af0d3e693a75b54'

        // submit order 
        const sourceCerts = {
            fromAmount: amount,
            fromIndex: USDTTokenForBnb.index, // eth
            fromChain: 'BNB',
            fromAddr: userAddress,
            certHash: '',
            fromPublicKey: '', // default
            signature: '123456' // default '123456'
        }

        const sourceCertsStr= JSON.stringify(sourceCerts)
        let sourceCertsForHex = hexlify(toUtf8Bytes(sourceCertsStr))
        sourceCertsForHex = sourceCertsForHex.substring(2)

        const bodyParams = {
            channel: "chainge", // Your unique identity
            extra: extra,
            orderType: '2', // 2, aggregate
            slippage: slippage, 
            sourceCerts: sourceCertsForHex, 
            toChain: 'BNB',
            toIndex: USDCTokenForBnb.index,
            toAddr: userAddress,
            execStrategy: "",
            timeout: "0",
            triggerPrice: "0",
        }
        const orderParamsHex = hexlify(toUtf8Bytes(JSON.stringify(bodyParams)))
        let value = '0'
        if(USDTTokenForBnb.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            value = amount
        }
        const isApproved = await tokenApprove(USDTTokenForBnb, v2ContractForBNB)
        if(!isApproved) return false
        const signer = await getSigner()
        const writeContract = new ethers.Contract(v2ContractForBNB, abi, signer)
        const options = {value: value}
        const result = await writeContract.vaultOut(USDTTokenForBnb.address, amount, USDTTokenForBnb.burnable, orderParamsHex, options)
    } else {
        // This information can be obtained through the getChain APIs(builtInSwapProxy)
        const v2SwapContractForBNB = '0xbffca20712e0906d1ef74f3e0a7cbe050aa6228a'
        const params = {
            chain: 'BNB',
            aggregator,
            fromTokenAddress: USDTTokenForBnb.address,
            fromDecimal: USDTTokenForBnb.decimals,
            fromAmount: amount,
            toTokenAddress: USDCTokenForBnb.address,
            toDecimal: USDCTokenForBnb.decimals,
            sender: userAddress,
            recipient: v2SwapContractForBNB,
            slippage,
            allowPartialFill: true,
            routeSummary
        }
        const swapResult = await getAggregateSwap(params)
        if(swapResult.code !== 0) return
        const {data, to} = swapResult.data

        // submit order 
        const sourceCerts = {
            fromAmount: amount,
            fromIndex: USDTTokenForBnb.index, // eth
            fromChain: 'BNB',
            fromAddr: userAddress,
            certHash: '',
            fromPublicKey: '', // default
            signature: '123456' // default '123456'
        }

        const sourceCertsStr= JSON.stringify(sourceCerts)
        let sourceCertsForHex = hexlify(toUtf8Bytes(sourceCertsStr))
        sourceCertsForHex = sourceCertsForHex.substring(2)

        const bodyParams = {
            channel: "chainge", // Your unique identity
            extra: extra,
            orderType: '2', // 2, aggregate
            slippage: slippage, 
            sourceCerts: sourceCertsForHex, 
            toChain: 'BNB',
            toIndex: USDCTokenForBnb.index,
            toAddr: userAddress,
            execStrategy: "",
            timeout: "0",
            triggerPrice: "0",
        }
        const orderParamsHex = hexlify(toUtf8Bytes(JSON.stringify(bodyParams)))
        let value = '0'
        if(USDTTokenForBnb.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            value = amount
        }
        const isApproved = await tokenApprove(USDTTokenForBnb, v2SwapContractForBNB)
        if(!isApproved) return false
        const signer = await getSigner()
        const writeContract = new ethers.Contract(v2SwapContractForBNB, abi, signer)
        const options = {value: value}
        const result = await writeContract.swap(USDTTokenForBnb.address, amount, to, USDCTokenForBnb.address, userAddress, miniAmountForExtra, data, orderParamsHex, options)
    }
    
}