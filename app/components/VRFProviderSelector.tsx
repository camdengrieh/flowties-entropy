'use client';

import { useState } from 'react';
import { VRF_PROVIDERS, VRFProvider } from '../config/vrf-providers';
import Image from 'next/image';

interface VRFProviderSelectorProps {
  selectedProvider: VRFProvider;
  onSelect: (provider: VRFProvider) => void;
}

export default function VRFProviderSelector({ selectedProvider, onSelect }: VRFProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (provider: VRFProvider) => {
    onSelect(provider);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="space-y-3">
        <label className="block font-press-start text-xs text-neon-blue">
          VRF Provider
        </label>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-black/50 border border-neon-purple/20 rounded-xl px-4 py-3 flex items-center justify-between gap-2 group hover:border-neon-blue transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              {selectedProvider.logoUrl && (
                <div className="w-6 h-6 relative">
                  <Image
                    src={selectedProvider.logoUrl}
                    alt={selectedProvider.name}
                    width={24}
                    height={24}
                    className="object-contain"
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null; // prevents looping
                      currentTarget.src = '/images/chains/flow.svg';
                    }}
                  />
                </div>
              )}
              <div className="flex flex-col items-start">
                <span className="text-neon-green font-press-start text-sm">{selectedProvider.name}</span>
                <span className="text-white/70 text-xs">{selectedProvider.chainName}</span>
              </div>
            </div>
            <svg 
              className={`w-5 h-5 text-neon-purple transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-2 w-full rounded-xl bg-black border border-neon-purple/30 shadow-lg shadow-neon-purple/20 overflow-hidden">
              <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neon-purple scrollbar-track-black/20">
                {VRF_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSelect(provider)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-neon-purple/10 transition-colors duration-200 ${
                      selectedProvider.id === provider.id ? 'bg-neon-purple/20' : ''
                    }`}
                  >
                    {provider.logoUrl && (
                      <div className="w-6 h-6 relative flex-shrink-0">
                        <Image
                          src={provider.logoUrl}
                          alt={provider.name}
                          width={24}
                          height={24}
                          className="object-contain"
                          onError={({ currentTarget }) => {
                            currentTarget.onerror = null; // prevents looping
                            currentTarget.src = '/images/chains/flow.svg';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex flex-col items-start text-left">
                      <span className={`font-press-start text-sm ${
                        selectedProvider.id === provider.id ? 'text-neon-green' : 'text-white'
                      }`}>
                        {provider.name}
                      </span>
                      <span className="text-white/70 text-xs">{provider.chainName}</span>
                      <p className="text-white/50 text-xs mt-1 line-clamp-2">{provider.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Provider Info */}
      <div className="mt-3 bg-black/30 rounded-lg border border-neon-purple/10 p-3">
        <div className="flex justify-between items-start text-xs">
          <span className="text-white/70">Contract:</span>
          <a
            href={`${selectedProvider.blockExplorerUrl}/address/${selectedProvider.contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-blue hover:text-neon-green transition-colors duration-200"
          >
            {`${selectedProvider.contractAddress.substring(0, 6)}...${selectedProvider.contractAddress.substring(selectedProvider.contractAddress.length - 4)}`}
          </a>
        </div>
      </div>
    </div>
  );
} 