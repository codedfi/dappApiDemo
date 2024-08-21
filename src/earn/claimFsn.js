import { MaxUint256, ethers, formatUnits, hexlify, parseUnits, toUtf8Bytes } from 'ethers'
import earnClaimAbi from './abi.js'
//The following example demonstrates how to use the ethers library to sign a transaction. This code can only run in a browser. Please adapt it to your specific situation:

const claimContract = `0x0985d161a36730ef0315ead01ad3ad644c56d035`

// fusion
const btcAddress = `0x585f70e031c9c10e99b7904a741dc54fe1fed197`
const ethAddress = `0xd82fe57a2643fbc692585bcb88df1d5d9c636cc8`
const usdtAddress = `0x8a20c13b42d7fe418f10f922f2cee06246c24269`
const usdcAddress = `0xfc9e57d7543e0591824121fda6461fe2148a5966`
const daiAddress = `0xfb180c0f8e49f784257f713ef37041dcbce0d2d1`

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
        const writeContract = new ethers.Contract(claimContract, earnClaimAbi, signer)
        const result = await writeContract.claimRewards(ETHTokenForEth.address)
    } catch(error) {
        console.log(error)
    }
}

// example
// claimNow(btcAddress)