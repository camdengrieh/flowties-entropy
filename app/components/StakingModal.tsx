'use client';

import { useState, useEffect } from 'react';
import { getCurrentVRFProvider } from '../utils/contracts';

interface StakingModalProps {
  onClose: () => void;
}

export default function StakingModal({ onClose }: StakingModalProps) {
  const [amount, setAmount] = useState<string>('0');
  const [duration, setDuration] = useState<number>(30); // days
  const [estimatedRewards, setEstimatedRewards] = useState<string>('0');
  const [staked, setStaked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const vrfProvider = getCurrentVRFProvider();

  // Calculate rewards when amount or duration changes
  useEffect(() => {
    const amountValue = parseFloat(amount) || 0;
    // Mock APY calculation - 5% base + 0.5% per day staked
    const apy = 5 + (duration * 0.5);
    const reward = amountValue * (apy / 100) * (duration / 365);
    setEstimatedRewards(reward.toFixed(4));
  }, [amount, duration]);

  const handleStake = async () => {
    if (parseFloat(amount) <= 0) {
      return;
    }

    setLoading(true);
    
    // Simulate transaction delay
    setTimeout(() => {
      setStaked(true);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/70 overflow-auto">
      <div className="relative w-full max-w-lg m-4">
        <div className="absolute -inset-1 bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple rounded-xl blur opacity-75 animate-pulse"></div>
        <div className="relative overflow-hidden border-2 border-neon-green rounded-xl bg-black p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-press-start text-xl text-neon-green">Stake Tokens</h2>
              <button
                onClick={onClose}
                className="text-neon-pink hover:text-neon-purple transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {!staked ? (
              <>
                <div className="space-y-3">
                  <label className="block font-press-start text-xs text-neon-blue">
                    Amount to Stake ({vrfProvider.id === 'flow' ? 'FLOW' : vrfProvider.id.toUpperCase()})
                  </label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-green to-neon-blue rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-4 bg-black/50 rounded-xl border border-neon-green/20 focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 focus:outline-none text-neon-green font-press-start text-sm transition-all duration-300"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block font-press-start text-xs text-neon-blue">
                    Staking Duration (Days)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="1"
                      max="365"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-neon-green"
                    />
                    <div className="flex justify-between text-xs text-neon-purple">
                      <span>1 day</span>
                      <span>{duration} days</span>
                      <span>365 days</span>
                    </div>
                  </div>
                </div>

                <div className="bg-neon-green/10 border border-neon-green/30 rounded-xl p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neon-blue text-sm">Est. APY:</span>
                      <span className="text-neon-green text-sm font-bold">{(5 + (duration * 0.5)).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neon-blue text-sm">Est. Rewards:</span>
                      <span className="text-neon-green text-sm font-bold">{estimatedRewards} {vrfProvider.id === 'flow' ? 'FLOW' : vrfProvider.id.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleStake}
                    disabled={loading || parseFloat(amount) <= 0}
                    className="relative w-full group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-1000 group-disabled:opacity-25"></div>
                    <div className="relative px-6 py-4 bg-black rounded-xl flex items-center justify-center gap-3 font-press-start text-sm text-white group-hover:text-neon-green transition-all duration-300 group-disabled:cursor-not-allowed">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Staking...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                          </svg>
                          <span>Stake Now</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <svg className="w-16 h-16 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="text-center space-y-4">
                  <h3 className="font-press-start text-neon-blue text-lg">Staking Successful!</h3>
                  <div className="space-y-2">
                    <p className="text-white text-sm">
                      You have staked <span className="text-neon-green">{amount} {vrfProvider.id === 'flow' ? 'FLOW' : vrfProvider.id.toUpperCase()}</span> for <span className="text-neon-green">{duration} days</span>.
                    </p>
                    <p className="text-white text-sm">
                      Estimated rewards: <span className="text-neon-green">{estimatedRewards} {vrfProvider.id === 'flow' ? 'FLOW' : vrfProvider.id.toUpperCase()}</span>
                    </p>
                    <p className="text-neon-purple text-xs mt-4">
                      Note: This is a mock staking mechanism for demonstration purposes.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="relative group mt-4"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                    <div className="relative px-6 py-3 bg-black rounded-xl font-press-start text-sm text-white group-hover:text-neon-blue transition-all duration-300">
                      Close
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 