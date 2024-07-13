// https://api2.chainge.finance/v1/getChain


/**
 * To list all supported chains
 * @returns 
 * chain data structure
[
    ...,
    {
        "chainIndex": 1,  
        "fullName": "Fusion",
        "nickName": "FSN",
        "baseCoin": "FSN",
        "decimals": 18,
        "poll": 10,
        "confirmations": 3,
        "family": 1,
        "sigMethod": 0,
        "network": "32659",
        "bip44Path": "m/44'/60'/0'/0/0",
        "publicEndpoint": "",
        "privateEndpoint": "",
        "scanUrl": "https://fsnscan.io",
        "needNonce": true,
        "disabled": false,  // When it's true, the chain should be disabled and unavailable for use.
        "delisted": false,  // When it's true, the chain should be disabled and unavailable for use.
        "builtInMinterProxy": "0x1e0cc9b982c7c3fb1ec704c28f48c35e7bed08a1",
        "builtInMinterProxyV2": "0x3668c219b1fa8fe8175158f6ce91ded36fde9152", // 2.0 Contract Address
        "builtInSwapProxy": "0xaf5a8cbcce58267d05577a560d04b51d46dcc124", // 2.0 swap Contract Address
        "weth": "0x8fdc02dc969a22c02ddffd3d8b547fab3d7702fe",
        "swapGasMin": "1",
        "swapGasMax": "10"
    },
    ...
]
 */
export const getChain = async () => {
    try {
        const response = await fetch('https://api2.chainge.finance/v1/getChain', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            },
        })
        const result = await response.json()
        if(result.code === 0) {
            const allChain = result.data.list
            const tempList = allChain.filter(item => !item.disabled && !item.delisted)
            return tempList
        }
    } catch(error) {
        console.log(error)
    }
}

/**
 * To list all supported assets
 * Token data structure
{
    "index": 1,
    "name": "Chainge",
    "symbol": "XCHNG",
    "cmcid": 9071,
    "delisted": false,
    "visible": true,
    "contracts": {
        "ARB": {
            "address": "0x51c601dc278eb2cfea8e52c4caa35b3d6a9a2c26",
            "decimals": 18
        },
        "ETH": {
            "address": "0xb712d62fe84258292d1961b5150a19bc4ab49026",
            "decimals": 18
        },
        "FSN": {
            "address": "0xab1f7e5bf2587543fe41f268c59d35da95f046e0",
            "decimals": 18,
            "burnable": true
        }
    }
}
 */
export const getAssets = async () => {
    try {
        const response = await fetch('https://api2.chainge.finance/v1/getAssets', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            },
        })
        const result = await response.json()
        if(result.code === 0) {
            const allToken = result.data.list
            const tempList = allToken.filter(item => item.visible && !item.delisted)
            console.log(tempList)
            return tempList
        }
    } catch(error) {
        console.log(error)
    }
}

/**
 * To list all supported assets by chain nickname
 * @param {*} chainNickName 
 * @returns 
 * Token data structure
    {
        "index": 1,
        "name": "Chainge",
        "symbol": "XCHNG",
        "decimals": 18,
        "contractAddress": "0xab1f7e5bf2587543fe41f268c59d35da95f046e0",
        "cmcid": 9071,
        "burnable": true
    }
 */
export const getAssetsByChain = async (chainNickName) => {
    try {
        const response = await fetch('https://api2.chainge.finance/v1/getAssetsByChain?chain=' + chainNickName, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            },
        })
        const result = await response.json()
        if(result.code === 0) {
            return result.data.list
        }
    } catch(error) {
        console.log(error)
    }
}

/**
 * https://api2.chainge.finance/v1/getBridgeQuote?symbol=USDT&amount=10000000&fromChain=ARB&toChain=BNB&channelFeeRate=10
 * 
{
    "code": 0,
    "msg": "success",
    "data": {
        "price": "1",
        "outAmount": "10000000000000000000",
        "outAmountUsd": "10.000000000000000000",
        "serviceFee": "16000000000000000",
        "gasFee": "300000000000000000",
        "serviceFeeRate": "16"
    }
}
 */
export const getBridgeQuote = async (params) => {
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
        console.log(error)
    }
}

/**
 * https://api2.chainge.finance/v1/getAggregateQuote?fromChain=BNB&fromTokenAddress=0x55d398326f99059ff775485246999027b3197955&fromDecimal=18&fromAmount=1000000000000000000&toChain=FSN&toTokenAddress=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&toDecimal=18&channelFeeRate=10
 * 
{
    "code": 0,
    "msg": "success",
    "data": {
        "chain": "32659",
        "chainDecimal": 18,
        "aggregator": "ChaingeDex",
        "outAmount": "13191607540000000000",
        "outAmountUsd": "0.8808303005",
        "gasFee": "1340908080000000000",
        "serviceFeeRate": "30",
        "serviceFee": "39574822620000000",
        "slippage": "1",
        "priceImpact": "0.22"
    }
}
 */
export const getAggregateQuote = async (params) => {
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
        console.log(error)
    }
}


/**
 * https://api2.chainge.finance/v1/getAggregateSwap?chain=FSN&aggregator=chaingedex&fromTokenAddress=0x4f318ba2b9d317edd7786271d6c161498102c39e&fromDecimal=8&fromAmount=100000000&toTokenAddress=0x8a20c13b42d7fe418f10f922f2cee06246c24269&toDecimal=6&sender=0xBda05e4421bF7e682635B7B18978f2dad4eCC059&recipient=0xBda05e4421bF7e682635B7B18978f2dad4eCC059&slippage=1
 * {
    "code": 0,
    "msg": "success",
    "data": {
        "amountOut": "7821",
        "from": "0xbda05e4421bf7e682635b7b18978f2dad4ecc059",
        "to": "0x62bc5327868a998e1b3d9fe6037273e642a137ae",
        "gas": "0",
        "value": "0",
        "data": "0x38ed17390000000000000000000000000000000000000000000000000000000005f5e1000000000000000000000000000000000000000000000000000000000000001e3f00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000bda05e4421bf7e682635b7b18978f2dad4ecc059000000000000000000000000000000000000000000000000000000006693bb3a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000004f318ba2b9d317edd7786271d6c161498102c39e0000000000000000000000008a20c13b42d7fe418f10f922f2cee06246c24269"
    }
}
 */
export const getAggregateSwap = async (params) => {
    try {
        const paramsStr = new URLSearchParams(params)
        const response = await fetch('https://api2.chainge.finance/v1/getAggregateSwap?' + paramsStr, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            },
        })
        const result = await response.json()
        return result
    } catch(error) {
        console.log(error)
    }
}