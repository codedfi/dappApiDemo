import { Interface, ethers, formatUnits, hexlify, keccak256, parseUnits, toUtf8Bytes } from 'ethers'
//The following example demonstrates how to use the ethers library to sign a transaction. This code can only run in a browser. Please adapt it to your specific situation:
const minterAddress  = '0x8a4aa176007196d48d39c89402d3753c39ae64c1'
const userAddress = '0x42a6685ef29886Cbcb595Aa903f00dea0d1787d8'

const getProvider = () => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    return provider
}
  
const getSigner = async () => {
    const provider = getProvider()
    const signer = await provider.getSigner();
    return signer
}

const encodeFunctionData = (address, amount) => {
    const iface = new Interface(inscriptionABI)
    const data = iface.encodeFunctionData("transfer", [address, amount])
    return data
}

const getCrethash = async (tokenInfo, amount) => {
    try {
        const { decimals: tokenDecimals, address: tokenAddress  } = tokenInfo

        const amountDecimals = parseUnits(amount, tokenDecimals)
        if(tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            const signer = await getSigner()
            // user address
            const address = await signer.getAddress()
            const gasPrice = (await provider.getFeeData()).gasPrice
            const gasLimit = 21000n
            const hash = await signer.sendTransaction({
                from: address,
                to: minterAddress,
                value: amountDecimals,
                data: '0x',
                gasPrice: gasPrice,
                gasLimit: gasLimit
            })
            return hash
        } else {
            const signer = await getSigner()
            // user address
            const address = await signer.getAddress()
            const gasPrice = (await provider.getFeeData()).gasPrice
            const dataHex  = encodeFunctionData(minterAddress, amountDecimals)
            const gasLimit = await signer.estimateGas({
                from: address,
                to: tokenAddress,
                value: '0',
                data: dataHex,
                gasPrice: gasPrice,
            })
            const hash = await signer.sendTransaction({
                from: address,
                to: tokenAddress,
                value: '0',
                data: dataHex,
                gasPrice: gasPrice,
                gasLimit: gasLimit
            })
            return hash
        }
    } catch(error) {
        console.log(error)
    }
}


const sortParams = (params, evmAddress) => {
    let keys = Object.keys(params)
    if(!keys.length) return undefined
    keys = keys.sort();
    const keyValList = []
    for (const key of keys) {
        const val = params[key];
        if(val) {
            keyValList.push(`${key}=${val}`)
        }
    }
    const data = keyValList.join('&')
    const raw = `EvmAddress=${evmAddress}&${data}`
    return raw
}

// ETH chain
const fnTestSendETH = async () => {
    const tokenInfo = {
        symbol: 'ETH',
        decimals: 18,
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    }
    const amount = '1'
    const certHash = await getCrethash(tokenInfo, amount)
}

// ETH chain
const fnTestSendUSDT = async () => {
    const tokenInfo = {
        symbol: 'USDT',
        decimals: 6,
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7'
    }
    const amount = '1'
    const certHash = await getCrethash(tokenInfo, amount)
}

// submit order 
const submitOrder = async (params, headers) => {
    try {
        const response = await fetch('https://api2.chainge.finance/v1/submitOrder', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                ...headers
            },
            body: JSON.stringify(params)
        })
        const result = await response.json()
    } catch(error) {
        console.log("submitOrder:error:", error)
    }
}

// quote by bridge
const getBridgeQuote = async (params) => {
    try {
        const paramsStr = new URLSearchParams(params)
        const response = await fetch('https://api2.chainge.finance/v1/getBridgeQuote?' + paramsStr, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            },
        })
        const result = await response.json()
        return result
    } catch(error) {
        console.log('getBridgeQuote:error:', error)
    }
}


const signMessage = async (message) => {
    const signer = await getSigner()
    const signature = await signer.signMessage(message)
    return signature
}


// quote by aggregate
const getAggregateQuote = async (params) => {
    try {
        const paramsStr = new URLSearchParams(params)
        const response = await fetch('https://api2.chainge.finance/v1/getAggregateQuote?' + paramsStr, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            },
        })
        const result = await response.json()
        return result
    } catch(error) {
        console.log('getBridgeQuote:error:', error)
    }
}

// ETH/ETH => BNB/ETH bridge
const fnTestBridget = async () => {
    // This information can be obtained through the getChain and getAssets APIs.
    const ETHTokenForEth = {
        index: '4',
        symbol: 'ETH',
        decimals: 18,
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    }

    const ETHTokenForBnb = {
        index: '4',
        symbol: 'ETH',
        decimals: 18,
        address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8'
    }
    const fromAmount = '1'
    const amount = parseUnits(fromAmount, ETHTokenForEth.decimals).toString()
    const params = {
        amount: amount,
        symbol: 'ETH',
        fromChain: 'ETH',
        toChain: 'BNB'
    }
    // quote 
    const quoteResult = await getBridgeQuote(params)
    if(quoteResult.code !== 0) return
    const { outAmount, serviceFee, gasFee } = quoteResult.data

    // Third-party transaction fee.
    const thirdAmountForExtra = '2_30'; // The third-party fee ranges from 0.1% to 0.5%, expressed in basis points.
    
    const thirdRateNum = parseUnits('30', ETHTokenForEth.decimals)
    const thirdRateDen = parseUnits('10000', ETHTokenForEth.decimals)
    const thirdFee = formatUnits(BigInt(amount) * thirdRateNum / thirdRateDen, ETHTokenForEth.decimals)
    const thirdFeeBI = parseUnits(thirdFee, ETHTokenForBnb.decimals)

    // Calculate the value the user should receive.
    const receiveAmountForExtra = (BigInt(outAmount) - BigInt(serviceFee) - BigInt(gasFee) - thirdFeeBI).toString()

    const extra = `1_${receiveAmountForExtra};${thirdAmountForExtra}`

    // sign and get tx hash
    const certHash = await getCrethash(ETHTokenForEth, fromAmount)

    // submit order 
    const sourceCerts = {
        fromAmount: amount,
        fromIndex: ETHTokenForEth.index, // eth
        fromChain: 'ETH',
        fromAddr: userAddress,
        certHash: certHash,
        fromPublicKey: '', // default
        signature: '123456' // default '123456'
    }

    const sourceCertsStr= JSON.stringify(sourceCerts)
    let sourceCertsForHex = hexlify(toUtf8Bytes(sourceCertsStr))
    sourceCertsForHex = sourceCertsForHex.substring(2)

    const bodyParams = {
        channel: "chainge", // Your unique identity
        extra: extra,
        orderType: '1', // 1, bridage
        slippage: '0', 
        sourceCerts: sourceCertsForHex, 
        toChain: 'BNB',
        toIndex: ETHTokenForBnb.index,
        toAddr: userAddress,
        execStrategy: "",
        timeout: "0",
        triggerPrice: "0",
    }

    let raw = sortParams(bodyParams, userAddress)
    raw = keccak256(toUtf8Bytes(raw))

    let signature = await signMessage(raw)
    if(signature.indexOf('0x') === 0) {
        signature = signature.substring(2)
    }

    const headers = {
        EvmAddress: userAddress,
        Signature: signature,
    };

    await submitOrder(bodyParams, headers)
}


// ETH/ETH => BNB/BNB or ETH/ETH => USDT/ETH,  All non-cross-chain transactions can be routed to the mode
const fnTestAggregate = async () => {
    // This information can be obtained through the getChain and getAssets APIs.
    const ETHTokenForEth = {
        index: '4',
        symbol: 'ETH',
        decimals: 18,
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    }

    const BNBTokenForBnb = {
        index: '124',
        symbol: 'BNB',
        decimals: 18,
        address: '0x4b0f1812e5df2a09796481ff14017e6005508003'
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
        toChain: 'BNB'
    }
    // quote 
    const quoteResult = await getAggregateQuote(params)
    if(quoteResult.code !== 0) return
    const { chain, chainDecimal, outAmount, serviceFee, gasFee } = quoteResult.data

    // Third-party transaction fee.
    const thirdAmountForExtra = '2_30'; // The third-party fee ranges from 0.1% to 0.5%, expressed in basis points.

    const thirdRateNum = parseUnits('30', ETHTokenForEth.decimals)
    const thirdRateDen = parseUnits('10000', ETHTokenForEth.decimals)
    const thirdFee = formatUnits(BigInt(amount) * thirdRateNum / thirdRateDen, ETHTokenForEth.decimals)
    const thirdFeeBI = parseUnits(thirdFee, chainDecimal)

    // Calculate the value the user should receive.
    const toAmount = formatUnits(BigInt(outAmount) - BigInt(serviceFee) - BigInt(gasFee) - thirdFeeBI, chainDecimal)
    const receiveAmountForExtra = (parseUnits(toAmount), BNBTokenForBnb.decimals).toString()

    const extra = `1_${receiveAmountForExtra};${thirdAmountForExtra}`

    // sign and get tx hash
    const certHash = await getCrethash(ETHTokenForEth, fromAmount)

    // submit order 
    const sourceCerts = {
        fromAmount: amount,
        fromIndex: ETHTokenForEth.index, // eth
        fromChain: 'ETH',
        fromAddr: userAddress,
        certHash: certHash,
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
        slippage: '0', 
        sourceCerts: sourceCertsForHex, 
        toChain: 'BNB',
        toIndex: BNBTokenForBnb.index,
        toAddr: userAddress,
        execStrategy: "",
        timeout: "0",
        triggerPrice: "0",
    }

    let raw = sortParams(bodyParams, userAddress)
    raw = keccak256(toUtf8Bytes(raw))

    let signature = await signMessage(raw)
    if(signature.indexOf('0x') === 0) {
        signature = signature.substring(2)
    }

    const headers = {
        EvmAddress: userAddress,
        Signature: signature,
    };

    await submitOrder(bodyParams, headers)
}