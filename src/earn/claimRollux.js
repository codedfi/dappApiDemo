import { MaxUint256, ethers, formatUnits, hexlify, parseUnits, toUtf8Bytes } from 'ethers'
//The following example demonstrates how to use the ethers library to sign a transaction. This code can only run in a browser. Please adapt it to your specific situation:

const userAddress = '0x42a6685ef29886Cbcb595Aa903f00dea0d1787d8'
const minterAddress = `0x85836bf230C8f0e844Fa2eBB4616778E3D347E77`

const getProvider = () => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    return provider
}
  
const getSigner = async () => {
    const provider = getProvider()
    const signer = await provider.getSigner();
    return signer
}

const claimNow = async (claimableTokenAddress) => {
    try {
        const signer = await getSigner()
        await signer.sendTransaction({
            to: minterAddress,
            from: userAddress,
            data: hexlify(toUtf8Bytes('ETH_1000000:SYS_10000000')),
            value: BigInt(0)
        })
    } catch(error) {
        console.log(error)
    }
}

// example
// claimNow(btcAddress)