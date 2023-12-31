/* global BigInt */
import React, { useEffect } from 'react'
import config from './config/config.json'
import abi from './config/abi.json'
import './css/App.css'

// Web3 Onboard
import { init, useConnectWallet } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import { ethers } from 'ethers'
import Onboard from '@web3-onboard/core'
import walletConnectModule from '@web3-onboard/walletconnect'
import ledgerModule from '@web3-onboard/ledger'
import dcentModule from '@web3-onboard/dcent'

const injected = injectedModule()

const walletConnect = walletConnectModule({
  bridge: 'https://bridge.walletconnect.org',
  qrcodeModalOptions: {
      mobileLinks: ['rainbow', 'metamask', 'argent', 'trust', 'imtoken', 'pillar']
  },
  connectFirstChainId: true
})

const ledger = ledgerModule()

const dcent = dcentModule()

// initialize Onboard
init({
  wallets: [injected, walletConnect, ledger, dcent],
  chains: [
    {
      id: config.CHAIN_ID,
      token: config.CHAIN_TOKEN_NAME,
      label: config.CHAIN_LABEL,
      rpcUrl: config.CHAIN_URI,
      // Adding the icon breaks the widget for some dumb reason
      //icon: flareIcon,
    }
  ],
  theme: 'system',
  notify: {
    desktop: {
      enabled: true,
      transactionHandler: transaction => {
        console.log({ transaction })
        if (transaction.eventCode === 'txPool') {
          return {
            type: 'success',
            message: 'Your transaction from #1 DApp is in the mempool',
          }
        }
      },
      position: 'bottomRight'
    },
    mobile: {
      enabled: true,
      transactionHandler: transaction => {
        console.log({ transaction })
        if (transaction.eventCode === 'txPool') {
          return {
            type: 'success',
            message: 'Your transaction from #1 DApp is in the mempool',
          }
        }
      },
      position: 'bottomRight'
    }
  },
  accountCenter: {
    desktop: {
      position: 'bottomRight',
      enabled: true,
      minimal: true
    },
    mobile: {
      position: 'bottomRight',
      enabled: true,
      minimal: true
    }
  },

})

export default function App() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [contract, setContract] = React.useState(null)
  const [rewardsSGB, setRewardsSGB] = React.useState(0)
  const [totalSupply, setTotalSupply] = React.useState(0)
  const [mintPriceSGB, setMintPriceSGB] = React.useState(0)
  const [mintPriceCGLD, setMintPriceCGLD] = React.useState(0)
  const [mintAmount, setMintAmount] = React.useState(1)
  const [isPresaleActive, setIsPresaleActive] = React.useState(false)

  // create an ethers provider
  let ethersProvider

  if (wallet) {
    // if using ethers v6 this is:
    // ethersProvider = new ethers.BrowserProvider(wallet.provider, 'any')
    ethersProvider = new ethers.providers.Web3Provider(wallet.provider, 'any')
  }

  const displayBigInt = (number, decimals = 4) => {
    if (number == 0) {
      return (0).toFixed(decimals)
    }
    console.log('number', number)
    console.log('ethers.utils.formatEther(number)', ethers.utils.formatEther(number))
    if (Number(ethers.utils.formatEther(number)).toFixed(decimals) == 0) {
      return "<" + "0.1".padEnd(decimals + 2, "0");
    }
    return Number(ethers.utils.formatEther(number)).toFixed(decimals)
  }

  const getContractData = async () => {
    try {
      if (!wallet) {
        console.log('Wallet not connected.')
        return
      }
      if (wallet.chains[0]['id'] !== config.CHAIN_ID) {
        throw new Error('Invalid chain.')
      }

      console.log('wallet', wallet.accounts[0]['address'])
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(config.ADDR_CONTRACT, abi, signer)
      if (!contract) {
        throw new Error('Failed to initialize contract.')
      }
      setContract(contract)
    } catch (error) { 
      console.log(error)
    }
  }

  useEffect(() => {
    getContractData()
  }, [wallet])

  useEffect(() => {
    displayRewards()
    displayTotalSupply()
    presaleActiveCheck()
  }, [contract])





  const displayRewards = async () => {
    try {
      if (!contract) {
        console.log('Contract not initialized.')
        setRewardsSGB("?")
      }
      const priceTx = await contract.MINT_PRICE_SGB()
      console.log('priceTx', priceTx._hex)
      setMintPriceSGB(displayBigInt((isPresaleActive ? BigInt((priceTx._hex * 0.9)) : BigInt(priceTx._hex)), 1))
      const priceTx2 = await contract.MINT_PRICE_CGLD()
      console.log('priceTx2', priceTx2._hex)
      setMintPriceCGLD(displayBigInt((isPresaleActive ? BigInt((priceTx._hex * 0.9)) : BigInt(priceTx._hex)), 1))

      const rewardsSGB = await contract.getClaimableAmountSGB(wallet.accounts[0]['address'])
      setRewardsSGB(displayBigInt(rewardsSGB._hex))
    } catch (error) {
      console.log(error)
      setRewardsSGB("?")
    }
  }

  const displayTotalSupply = async () => {
    try {
      if (!contract) {
        console.log('Contract not initialized.')
        setTotalSupply("?")
      }
      const totalSupply = await contract.totalSupply()
      console.log('totalSupply', totalSupply._hex)
      setTotalSupply(parseInt(totalSupply._hex, 16))
    } catch (error) {
      console.log(error)
      setTotalSupply("?")
    }
  }

  const presaleActiveCheck = async () => {
    try {
      if (!contract) {
        console.log('Contract not initialized.')
        setIsPresaleActive(false)
      }
      const isPresaleTx = await contract.isPresaleLive()
      console.log('isPresaleTx', isPresaleTx)
      setIsPresaleActive(isPresaleTx)
    } catch (error) {
      console.log(error)
      setIsPresaleActive(false)
    }
  }




  const mintSGB = async () => {
    try {
      if (!contract) {
        console.log('Contract not initialized.')
        return
      }
      let num = mintAmount
      const priceTx = await contract.MINT_PRICE_SGB()
      console.log('priceTx', priceTx._hex)
      console.log(num * priceTx._hex)
      let finalPrice = isPresaleActive ? BigInt(num * (priceTx._hex * 0.9)) : BigInt(num * priceTx._hex)

      const tx = await contract.mintNFTSGB(num, { value: finalPrice, gasLimit: 8000000 })
      console.log('tx', tx)
      await tx.wait()
      displayRewards()
    } catch (error) {
      console.log(error)
    }
  }

  const mintSpecifcNft = async (num) => {
    try {
      if (!contract) {
        console.log('Contract not initialized.')
        return
      }
      const priceTx = await contract.MINT_PRICE_SGB()
      console.log('priceTx', priceTx._hex)
      const tx = await contract.preMintNFT(num, "0xAe159D94CFd3Dea954389C4a181a3DB1F42b75B4")
      console.log('tx', tx)
      await tx.wait()
      displayRewards()
    } catch (error) {
      console.log(error)
    }
  }

  const mintFree = async (num) => {
    try {
      if (!contract) {
        console.log('Contract not initialized.')
        return
      }
      const priceTx = await contract.MINT_PRICE_SGB()
      console.log('priceTx', priceTx._hex)
      const tx = await contract.freeMintNFT("0xAe159D94CFd3Dea954389C4a181a3DB1F42b75B4")
      console.log('tx', tx)
      await tx.wait()
      displayRewards()
    } catch (error) {
      console.log(error)
    }
  }

  const claimSGB = async () => {
    try {
      if (!contract) {
        console.log('Contract not initialized.')
        return
      }
      const tx = await contract.claimRewardsSGB(wallet.accounts[0]['address']);
      console.log('tx', tx)
      await tx.wait()
      displayRewards()
    } catch (error) {
      console.log(error)
    }
  }


  if(!wallet) {
   return (
    <main className="App">
      {wallet != null && wallet.chains[0]['id'] !== config.CHAIN_ID && (
        
        <p>
          
          Please switch to the {config.CHAIN_LABEL} network.
        </p>
      )}

      <h1>
       NFT mint
      </h1>
      <h2>
        Simply connect your wallet to claim your holder rewards.
      </h2>
      <button className='neon-border btn' disabled={connecting} onClick={() => (wallet ? disconnect(wallet) : connect())}>
        {connecting ? 'Connecting' : wallet ? 'Disconnect' : 'Connect'}
      </button>

  </main>
   )
  }

  if(wallet != null && wallet.chains[0]['id'] !== config.CHAIN_ID ) {
    return (
      <main className="App">
        {wallet != null && wallet.chains[0]['id'] !== config.CHAIN_ID && (
          <h1>
            
            Please switch to the <b>{config.CHAIN_LABEL}</b> network.
          </h1>
        )}
    </main>
    )
  }

  return (
    <main className="App">
        {wallet != null && wallet.chains[0]['id'] !== config.CHAIN_ID && (
          
          <p>
            
            Please switch to the {config.CHAIN_LABEL} network.
          </p>
        )}

 
        <h1>
        Your rewards: <b>{rewardsSGB}SGB</b>
        </h1>
        <h2>
          NFTS minted: <b>{totalSupply}</b> at the price of <b>{mintPriceSGB} SGB</b> + <b>{mintPriceCGLD} CGLD</b> Presale: <b>{isPresaleActive ? "Active" : "Not Active"}</b>
        </h2>
        
        <button className='neon-border btn' disabled={connecting} onClick={() => (wallet ? disconnect(wallet) : connect())}>
          {connecting ? 'Connecting' : wallet ? 'Disconnect' : 'Connect'}
        </button>
        <button className='neon-border btn' onClick={() => mintSGB(mintSpecifcNft())}>
          mint {mintAmount} SGB + CGLD
        </button>
        <input type="range" min="1" max="10" id="amount" name="amount" onChange={(e) => {setMintAmount(e.target.value)}} value={mintAmount}/>
        <br></br>
        <h1>Only Owner</h1>
        <input type="number" id="quantity" name="quantity" min="1" max="100" />
        <label for="quantity">Nft ID for premint</label>
        <button className='neon-border btn' onClick={() => mintSpecifcNft(document.getElementById("quantity").value)} >
          Premint
          </button>
          <button className='neon-border btn' onClick={() => mintFree(1)}>
            Free mint
        </button>
        <button className='neon-border btn' onClick={() => claimSGB()}>
          claim SGB
        </button>
    </main>
  );
}
