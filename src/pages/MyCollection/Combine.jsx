'use client'

import React, { useState, useEffect, useContext } from 'react'
import { WalletContext } from '../../contexts/WalletContext'
import axios from 'axios'
import styles from './Combine.css'
import { RefreshCw } from 'lucide-react'

const OPENSEA_API_URL = 'https://api.opensea.io/api/v1/assets'

export default function UpgradeAndBurnNFT() {
  const { walletAddress, changeWallet } = useContext(WalletContext)
  const [nfts, setNfts] = useState([])
  const [nftToUpgrade, setNftToUpgrade] = useState(null)
  const [nftToBurn, setNftToBurn] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadNfts = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(OPENSEA_API_URL, {
        params: {
          owner: walletAddress,
          order_direction: 'desc',
          limit: 20,
          offset: 0,
        },
      })

      if (response.data && response.data.assets) {
        setNfts(response.data.assets)
      }
    } catch (error) {
      console.error('Error fetching NFTs from OpenSea:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (walletAddress) {
      loadNfts()
    }
  }, [walletAddress])

  const handleUpgradeAndBurn = async () => {
    if (!nftToUpgrade || !nftToBurn) {
      alert('Please select both an NFT to upgrade and an NFT to burn.')
      return
    }

    try {
      const response = await axios.post('/upgrade-and-burn', {
        walletAddress,
        nftToUpgrade: nftToUpgrade.token_id,
        nftToBurn: nftToBurn.token_id,
      })
      alert(`Success! Transaction: ${response.data.transactionSignature}`)
    } catch (error) {
      alert('Error upgrading and burning NFTs.')
      console.error(error)
    }
  }

  const renderNftCards = (nfts, selectedNft, setSelectedNft) => {
    if (isLoading) {
      return Array(4).fill(0).map((_, index) => (
        <div key={index} className={styles.nftCardSkeleton}>
          <div className={styles.nftImageSkeleton}></div>
          <div className={styles.nftNameSkeleton}></div>
          <div className={styles.nftIdSkeleton}></div>
        </div>
      ))
    }

    if (nfts.length === 0) {
      return (
        <div className={styles.emptyNftCard}>
          <div className={styles.emptyNftIcon}>🖼️</div>
          <p className={styles.emptyNftText}>No NFTs found in your wallet</p>
          <button onClick={loadNfts} className={styles.refreshBtn}>
            <RefreshCw className={styles.refreshIcon} />
            Refresh NFTs
          </button>
        </div>
      )
    }

    return nfts.map((nft) => (
      <div 
        key={nft.token_id} 
        className={`${styles.nftCard} ${selectedNft === nft ? styles.selected : ''}`}
        onClick={() => setSelectedNft(nft)}
      >
        <img 
          src={nft.image_url || '/placeholder.svg'} 
          alt={nft.name} 
          className={styles.nftImage}
        />
        <p className={styles.nftName}>{nft.name || 'Unnamed NFT'}</p>
        <p className={styles.nftId}>#{nft.token_id}</p>
      </div>
    ))
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
        <h1 className={styles.title}>Upgrade and Burn NFT</h1>
        
        {walletAddress ? (
          <div className={styles.mainContent}>
            <div className={styles.walletCard}>
              <div className={styles.walletInfo}>
                <span className={styles.walletIcon}>👛</span>
                <span className={styles.walletAddress}>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
              <button onClick={changeWallet} className={styles.changeWalletBtn}>
                Change Wallet
              </button>
            </div>

            <div className={styles.nftSection}>
              <h2 className={styles.sectionTitle}>Select NFT to Upgrade</h2>
              <div className={styles.nftScrollContainer}>
                {renderNftCards(nfts, nftToUpgrade, setNftToUpgrade)}
              </div>
            </div>

            <div className={styles.nftSection}>
              <h2 className={styles.sectionTitle}>Select NFT to Burn</h2>
              <div className={styles.nftScrollContainer}>
                {renderNftCards(nfts, nftToBurn, setNftToBurn)}
              </div>
            </div>

            <button 
              onClick={handleUpgradeAndBurn} 
              className={styles.upgradeBtn}
              disabled={!nftToUpgrade || !nftToBurn}
            >
              Upgrade and Burn
            </button>
          </div>
        ) : (
          <div className={styles.connectWalletCard}>
            <p>Please connect your wallet to view and manage your NFTs.</p>
            <button onClick={changeWallet} className={styles.connectWalletBtn}>
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
