import { ethers } from 'ethers';
import { FLOW_VRF_PROVIDER, VRFProvider } from '../config/vrf-providers';

let provider: ethers.Provider | null = null;
let contract: ethers.Contract | null = null;
let currentVRFProvider: VRFProvider = FLOW_VRF_PROVIDER;

// Initialize read-only provider for view functions based on the selected VRF provider
const initializeReadOnlyProvider = (vrfProvider: VRFProvider = currentVRFProvider) => {
  try {
    provider = new ethers.JsonRpcProvider(vrfProvider.rpcUrl);
    contract = new ethers.Contract(
      vrfProvider.contractAddress,
      vrfProvider.abi,
      provider
    );
    currentVRFProvider = vrfProvider;
    console.log(`Initialized provider for ${vrfProvider.name}`);
    return { provider, contract };
  } catch (error) {
    console.error(`Failed to initialize provider for ${vrfProvider.name}:`, error);
    return { provider: null, contract: null };
  }
};

// Initialize wallet provider for transactions (if needed in the future)
export const initializeWalletProvider = async (vrfProvider: VRFProvider = currentVRFProvider) => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Please install MetaMask to use this application');
  }

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Check if we're on the correct network - this would need updating per VRF provider
    const requiredChainId = getChainIdForNetwork(vrfProvider.chainName);
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId !== requiredChainId) {
      try {
        // Try to switch to the correct network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: requiredChainId }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: requiredChainId,
              chainName: vrfProvider.chainName,
              nativeCurrency: getNetworkCurrency(vrfProvider.id),
              rpcUrls: [vrfProvider.rpcUrl],
              blockExplorerUrls: [vrfProvider.blockExplorerUrl],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }

    const walletProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await walletProvider.getSigner();
    provider = walletProvider;
    contract = new ethers.Contract(
      vrfProvider.contractAddress,
      vrfProvider.abi,
      signer
    );

    currentVRFProvider = vrfProvider;
    
    return { provider, contract };
  } catch (error: any) {
    console.error('Failed to initialize provider:', error);
    throw new Error(error.message || 'Failed to connect to wallet');
  }
};

function getChainIdForNetwork(networkName: string): string {
  const networks: Record<string, string> = {
    'Flow Testnet': '0x221', // 545 in decimal
    'Base Goerli Testnet': '0x14A33' // 84531 in decimal
  };
  
  return networks[networkName] || '0x1'; // Default to Ethereum mainnet
}

function getNetworkCurrency(networkId: string): { name: string; symbol: string; decimals: number } {
  const currencies: Record<string, { name: string; symbol: string; decimals: number }> = {
    'flow': { name: 'Flow Token', symbol: 'FLOW', decimals: 18 },
    'base': { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  };
  
  return currencies[networkId] || { name: 'Ether', symbol: 'ETH', decimals: 18 };
}

// Set current VRF provider
export const setVRFProvider = (vrfProvider: VRFProvider) => {
  try {
    initializeReadOnlyProvider(vrfProvider);
    return true;
  } catch (error) {
    console.error('Failed to set VRF provider:', error);
    return false;
  }
};

// Get current VRF provider
export const getCurrentVRFProvider = () => {
  return currentVRFProvider;
};

export const getRandomNumber = async (min: number, max: number, vrfProvider?: VRFProvider): Promise<number> => {
  // If a new provider is specified, initialize it
  if (vrfProvider && vrfProvider.id !== currentVRFProvider.id) {
    setVRFProvider(vrfProvider);
  }
  
  // Use read-only provider for view functions
  if (!contract) {
    initializeReadOnlyProvider();
  }
  if (!contract) throw new Error('Contract not initialized');

  try {
    // Convert numbers to BigInt for uint64/uint256
    const minBigInt = BigInt(Math.floor(min));
    const maxBigInt = BigInt(Math.floor(max));
    
    const result = await contract.getRandomNumber(minBigInt, maxBigInt);
    return Number(result);
  } catch (error: any) {
    console.error('Error in getRandomNumber:', error);
    throw new Error(error.message || 'Failed to generate random number');
  }
};

export const selectRandomItem = async (items: string[], vrfProvider?: VRFProvider): Promise<string> => {
  // If a new provider is specified, initialize it
  if (vrfProvider && vrfProvider.id !== currentVRFProvider.id) {
    setVRFProvider(vrfProvider);
  }
  
  // Use read-only provider for view functions
  if (!contract) {
    initializeReadOnlyProvider();
  }
  if (!contract) throw new Error('Contract not initialized');

  try {
    console.log(`Selecting random item from ${items.length} items:`, items);
    
    // If there's only one item, return it directly without calling the contract
    // This avoids the "Max must be greater than min" error
    if (items.length === 1) {
      console.log('Only one item available, returning it directly:', items[0]);
      return items[0];
    }
    
    if (items.length === 0) {
      throw new Error('Cannot select from an empty list of items');
    }
    
    const result = await contract.selectRandomItem(items);
    console.log('Random item selected:', result);
    return result;
  } catch (error: any) {
    console.error('Error in selectRandomItem:', error);
    
    // Add specific error handling for debugging
    if (error.message && error.message.includes('Max must be greater than min')) {
      console.error('The "Max must be greater than min" error occurred. Items:', items);
    }
    
    throw new Error(error.message || 'Failed to select random item');
  }
}; 