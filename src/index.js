import { MaxUint256, ethers, formatUnits, hexlify, parseUnits, toUtf8Bytes } from 'ethers'
const abi = [
    {
        inputs: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
          { internalType: "address", name: "spender", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenAddr",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "burnable",
                "type": "bool"
            },
            {
                "internalType": "bytes",
                "name": "order",
                "type": "bytes"
            }
        ],
        "name": "vaultOut",
        "outputs": [

        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenAddr",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "target",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "receiveToken",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "minAmount",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "callData",
                "type": "bytes"
            },
            {
                "internalType": "bytes",
                "name": "order",
                "type": "bytes"
            }
        ],
        "name": "swap",
        "outputs": [

        ],
        "stateMutability": "payable",
        "type": "function"
    },
]
//The following example demonstrates how to use the ethers library to sign a transaction. This code can only run in a browser. Please adapt it to your specific situation:
const userAddress = '0x42a6685ef29886Cbcb595Aa903f00dea0d1787d8'

// Third-party transaction fee.
const thirdAmountForExtra = '2_30'; // The third-party fee ranges from 0.1% to 0.5%, expressed in basis points.

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

let supportChainList = []
const getChain = async () => {
    try {
        const response = await fetch('https://api2.chainge.finance/v1/getChain', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            },
        })
        const result = await response.json()
        if(result.code === 0) {
            supportChainList = result.data.list
        }
        
        // chain Data structure
        // [
        //     ...,
        //     {
        //         "chainIndex": 1,  
        //         "fullName": "Fusion",
        //         "nickName": "FSN",
        //         "baseCoin": "FSN",
        //         "decimals": 18,
        //         "poll": 10,
        //         "confirmations": 3,
        //         "family": 1,
        //         "sigMethod": 0,
        //         "network": "32659",
        //         "bip44Path": "m/44'/60'/0'/0/0",
        //         "publicEndpoint": "",
        //         "privateEndpoint": "",
        //         "scanUrl": "https://fsnscan.io",
        //         "needNonce": true,
        //         "disabled": false,  // When it's true, the chain should be disabled and unavailable for use.
        //         "delisted": false,  // When it's true, the chain should be disabled and unavailable for use.
        //         "builtInMinterProxy": "0x1e0cc9b982c7c3fb1ec704c28f48c35e7bed08a1",
        //         "builtInMinterProxyV2": "0x3668c219b1fa8fe8175158f6ce91ded36fde9152", // 2.0 Contract Address
        //         "builtInSwapProxy": "0xaf5a8cbcce58267d05577a560d04b51d46dcc124", // 2.0 swap Contract Address
        //         "weth": "0x8fdc02dc969a22c02ddffd3d8b547fab3d7702fe",
        //         "swapGasMin": "1",
        //         "swapGasMax": "10"
        //     },
        //     ...
        // ]
    } catch(error) {

    }
}
getChain()

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
    // This information can be obtained through the getChain and getChains APIs.
    const v2ContractForETH = '0x4c5f53015f3adb1b1d15ddf4e17edaae6fa185a5'

    // This information can be obtained through the getChain and getAssets APIs.
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
        channelFeeRate: `30`, // thirdAmountForExtra
    }
    // quote 
    const quoteResult = await getBridgeQuote(params)
    if(quoteResult.code !== 0) return
    const { outAmount, serviceFee, gasFee } = quoteResult.data

    // Calculate the value the user should receive.
    const receiveAmountForExtra = (BigInt(outAmount) - BigInt(serviceFee) - BigInt(gasFee)).toString()

    // 1_Expected value;2_Third party profit ratio;3_version;4_Mini Amount;5_Execution chain
    const extra = `1_${receiveAmountForExtra};${thirdAmountForExtra};3_2;4_${receiveAmountForExtra};5_BNB`
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
    const orderParamsHex = hexlify(toUtf8Bytes(JSON.stringify(bodyParams)))
    let value = '0'
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

// ETH/ETH => BNB/BNB or ETH/ETH => USDT/ETH,  All non-cross-chain transactions can be routed to the mode
const fnTestAggregate = async () => {
    // This information can be obtained through the getChain and getChains APIs.
    const v2ContractForETH = '0x4c5f53015f3adb1b1d15ddf4e17edaae6fa185a5'
    // Slippage, in basis points format（range: 0.01% ~ 50%）. For example, 1% in basis points format is represented as 100.
    let slippage = '100'; // 1%

    // This information can be obtained through the getChain and getAssets APIs.
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
    const { chain, chainDecimal, outAmount, serviceFee, gasFee } = quoteResult.data
    // chain obj
    const executionChainObj = supportChainList.find((item) => item.network === chain)

    // Calculate the value the user should receive.
    const toAmount = formatUnits(BigInt(outAmount) - BigInt(serviceFee) - BigInt(gasFee), chainDecimal)
    const receiveAmountForExtra = formatUnits(parseUnits(toAmount), BNBTokenForBnb.decimals).toString()

    // Computed minimum
    const miniAmount = formatUnits(parseUnits(toAmount, 30) * parseUnits((1 - 100/10000) , 30), 30)
    const miniAmountForExtra = parseUnits(miniAmount, BNBTokenForBnb.decimals).toString()

    // 1_Expected value;2_Third party profit ratio;3_version;4_Mini Amount;5_Execution chain
    const extra = `1_${receiveAmountForExtra};${thirdAmountForExtra};3_2;4_${miniAmountForExtra};5_${executionChainObj.nickName}`


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

// BNB/USDT => BNB/USDC  In the case of the same chain, please use this mode.
const fnTestSwap = async () => {
    // This information can be obtained through the getChain and getChains APIs.
    const v2ContractForBNB = '0x99a57ac044e6ce44b7e161a07af0d3e693a75b54'
    const v2SwapContractForBNB = '0xbffca20712e0906d1ef74f3e0a7cbe050aa6228a'

    // Slippage, in basis points format（range: 0.01% ~ 50%）. For example, 1% in basis points format is represented as 100.
    let slippage = '100'; // 1%

    // This information can be obtained through the getChain and getAssets APIs.
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
    const { chain, chainDecimal, outAmount, serviceFee, gasFee, routeSummary = '', aggregator } = quoteResult.data
    // chain obj
    const  executionChainObj = supportChainList.find((item) => item.network === chain)

    // Calculate the value the user should receive.
    const toAmount = formatUnits(BigInt(outAmount) - BigInt(serviceFee) - BigInt(gasFee), chainDecimal)
    const receiveAmountForExtra = formatUnits(parseUnits(toAmount), USDCTokenForBnb.decimals).toString()

    // Computed minimum
    const miniAmount = formatUnits(parseUnits(toAmount, 30) * parseUnits((1 - 100/10000) , 30), 30)
    const miniAmountForExtra = parseUnits(miniAmount, USDCTokenForBnb.decimals).toString()

    // 1_Expected value;2_Third party profit ratio;3_version;4_Mini Amount;5_Execution chain
    const extra = `1_${receiveAmountForExtra};${thirdAmountForExtra};3_2;4_${miniAmountForExtra};5_${executionChainObj.nickName}`

    // If the execution chain is not the chain you selected.
    if(executionChainObj.nickName !== 'BNB') {
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
        const paramsStr = new URLSearchParams(params)
        const response = await fetch('https://api2.chainge.finance/v1/getAggregateSwap?' + paramsStr, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            },
        })
        const swapResult = await response.json()
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

fnTestBridget()