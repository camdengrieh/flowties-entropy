import { ethers } from 'ethers';

// Interface for VRF provider configuration
export interface VRFProvider {
  id: string;
  name: string;
  description: string;
  chainName: string;
  logoUrl: string;
  contractAddress: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  abi: any[];
}

// Flow VRF Contract (current implementation)
const FLOW_VRF_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "min",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "max",
        "type": "uint64"
      }
    ],
    "name": "getRandomNumber",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string[]",
        "name": "items",
        "type": "string[]"
      }
    ],
    "name": "selectRandomItem",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Base VRF Contract
const BASE_VRF_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "min",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "max",
        "type": "uint256"
      }
    ],
    "name": "getRandomNumber",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string[]",
        "name": "items",
        "type": "string[]"
      }
    ],
    "name": "selectRandomItem",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// List of all VRF providers
export const VRF_PROVIDERS: VRFProvider[] = [
  {
    id: 'flow',
    name: 'Default Random',
    description: 'Flow\'s native Verifiable Random Function for true on-chain randomness',
    chainName: 'Flow Testnet',
    logoUrl: '/images/chains/flow.svg',
    contractAddress: '0x91502a85Ad74ba94499145477dccA19b3E1D6124',
    rpcUrl: 'https://testnet.evm.nodes.onflow.org',
    blockExplorerUrl: 'https://evm-testnet.flowscan.io',
    abi: FLOW_VRF_ABI
  },
  {
    id: 'base',
    name: 'Base VRF',
    description: 'Base\'s Verifiable Random Function for secure and transparent randomness',
    chainName: 'Base Goerli Testnet',
    logoUrl: '/images/chains/base.svg',
    contractAddress: '0x8778be7Dd87De3752D1C64F558691d8c8dc52aeA',
    rpcUrl: 'https://goerli.base.org',
    blockExplorerUrl: 'https://goerli.basescan.org',
    abi: BASE_VRF_ABI
  }
];

// Default provider
export const FLOW_VRF_PROVIDER = VRF_PROVIDERS[0]; 