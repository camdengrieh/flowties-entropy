'use client';

import { useState } from 'react';
import { getRandomNumber, getCurrentVRFProvider, setVRFProvider } from '../utils/contracts';
import ResultCard from './ResultCard';
import { FLOW_VRF_PROVIDER, VRFProvider } from '../config/vrf-providers';
import VRFProviderSelector from './VRFProviderSelector';

export default function RandomNumber() {
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(100);
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [vrfProvider, setVRFProviderState] = useState<VRFProvider>(FLOW_VRF_PROVIDER);

  const handleProviderChange = (provider: VRFProvider) => {
    setVRFProviderState(provider);
    setVRFProvider(provider);
  };

  const generateRandom = async () => {
    if (min >= max) {
      setError('Minimum value must be less than maximum value');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getRandomNumber(min, max, vrfProvider);
      setRandomNumber(result);
    } catch (err) {
      console.error('Error generating random number:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate random number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <label className="block font-press-start text-xs text-neon-blue">
          Minimum Value
        </label>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-pink to-neon-blue rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative">
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              className="w-full px-4 py-4 bg-black/50 rounded-xl border border-neon-purple/20 focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 focus:outline-none text-neon-green font-press-start text-sm transition-all duration-300"
              placeholder="1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block font-press-start text-xs text-neon-blue">
          Maximum Value
        </label>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative">
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="w-full px-4 py-4 bg-black/50 rounded-xl border border-neon-purple/20 focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 focus:outline-none text-neon-green font-press-start text-sm transition-all duration-300"
              placeholder="100"
            />
          </div>
        </div>
      </div>

      <VRFProviderSelector selectedProvider={vrfProvider} onSelect={handleProviderChange} />

      <button
        onClick={generateRandom}
        disabled={loading || min >= max}
        className="relative w-full group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-1000 group-disabled:opacity-25 animate-gradient"></div>
        <div className="relative px-6 py-4 bg-black rounded-xl flex items-center justify-center gap-3 font-press-start text-sm text-white group-hover:text-neon-blue transition-all duration-300 group-disabled:cursor-not-allowed">
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.6569 16.6569C16.7202 17.5935 14.7616 19.5521 13.4138 20.8999C12.6327 21.681 11.3677 21.6814 10.5866 20.9003C9.26234 19.576 7.34159 17.6553 6.34315 16.6569C3.21895 13.5327 3.21895 8.46734 6.34315 5.34315C9.46734 2.21895 14.5327 2.21895 17.6569 5.34315C20.781 8.46734 20.781 13.5327 17.6569 16.6569Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Generate Random Number</span>
            </>
          )}
        </div>
      </button>

      {error && (
        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6 text-red-400 text-center font-press-start text-sm animate-pulse">
          {error}
        </div>
      )}

      {randomNumber !== null && !error && (
        <ResultCard type="number">
          <div className="font-press-start text-center p-4">
            <span className="text-neon-green animate-glow text-6xl">{randomNumber}</span>
          </div>
        </ResultCard>
      )}

      <div className="relative group cursor-pointer" onClick={() => setShowInfo(!showInfo)}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-black/50 rounded-xl p-6 border border-neon-purple/20">
          <div className="flex items-center justify-between">
            <h3 className="font-press-start text-sm text-neon-blue">How it works</h3>
            <svg className={`w-5 h-5 text-neon-pink transform transition-transform duration-300 ${showInfo ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {showInfo && (
            <div className="mt-4 space-y-4 text-sm">
              <p className="text-neon-green">
                This random number generator uses {vrfProvider.name} to produce true random numbers that are:
              </p>
              <ul className="list-disc list-inside space-y-2 text-white">
                <li>Verifiably random and tamper-proof</li>
                <li>Generated on-chain for maximum transparency</li>
                <li>Secured by the {vrfProvider.chainName} network</li>
              </ul>
              <div className="pt-4 space-y-2">
                <p className="text-neon-pink">Contract Address:</p>
                <a 
                  href={`${vrfProvider.blockExplorerUrl}/address/${vrfProvider.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-blue break-all hover:text-neon-green transition-colors duration-300"
                >
                  {vrfProvider.contractAddress}
                </a>
              </div>
              <div className="pt-4">
                <a 
                  href={vrfProvider.id === 'flow' ? "https://developers.flow.com/evm/guides/vrf" : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-purple hover:text-neon-pink transition-colors duration-300"
                >
                  Learn more about {vrfProvider.name} →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 