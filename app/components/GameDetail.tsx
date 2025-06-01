'use client';

import React, { useState, useEffect } from 'react';
import { shortenAddress } from '../utils/address';

interface Game {
  id: number;
  creator: string;
  player: string;
  isActive: boolean;
  isCompleted: boolean;
  creatorNFTIndex: bigint;
  playerNFTIndex: bigint;
}

interface GameDetailProps {
  game: Game;
  userAddress: string;
  onBack: () => void;
}

export default function GameDetail({ game, userAddress, onBack }: GameDetailProps) {
  const [animationPhase, setAnimationPhase] = useState('reveal'); // reveal, battle, result
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (game.isCompleted) {
      // If game is completed, show animation sequence
      const sequence = async () => {
        setAnimationPhase('reveal');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setAnimationPhase('battle');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        setAnimationPhase('result');
        setShowResults(true);
      };
      
      sequence();
    }
  }, [game.isCompleted]);

  const getWinner = (): { address: string; tokenId: bigint } | null => {
    if (!game.isCompleted) return null;
    
    // Determine winner based on higher token ID (as per contract logic)
    const creatorTokenId = game.creatorNFTIndex;
    const playerTokenId = game.playerNFTIndex;
    
    if (creatorTokenId > playerTokenId) {
      return { address: game.creator, tokenId: creatorTokenId };
    } else {
      return { address: game.player, tokenId: playerTokenId };
    }
  };

  const winner = getWinner();
  const isUserWinner = winner && winner.address.toLowerCase() === userAddress.toLowerCase();
  const isUserParticipant = game.creator.toLowerCase() === userAddress.toLowerCase() || 
                           game.player.toLowerCase() === userAddress.toLowerCase();

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background for battle */}
      <div className="fixed inset-0">
        <div className={`absolute inset-0 transition-all duration-1000 ${
          animationPhase === 'battle' 
            ? 'bg-gradient-to-r from-red-900/30 via-orange-500/20 to-red-900/30 animate-pulse' 
            : 'bg-black'
        }`}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-purple/20 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 font-press-start text-sm text-neon-blue hover:text-neon-pink transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Games
            </button>
            
            <div className="font-press-start text-lg text-neon-green">
              Game #{game.id}
            </div>
          </div>

          {/* Battle Arena */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue rounded-2xl blur opacity-75 animate-pulse"></div>
            <div className="relative bg-black rounded-xl p-8 border border-neon-purple">
              
              {/* Game Status */}
              <div className="text-center mb-8">
                <div className={`font-press-start text-lg mb-2 ${
                  game.isCompleted ? 'text-neon-green' : game.isActive ? 'text-neon-purple' : 'text-red-400'
                }`}>
                  {game.isCompleted ? 'BATTLE COMPLETED' : game.isActive ? 'BATTLE IN PROGRESS' : 'INACTIVE GAME'}
                </div>
                {!game.isCompleted && game.isActive && (
                  <div className="font-press-start text-sm text-neon-blue">
                    {game.player === '0x0000000000000000000000000000000000000000' 
                      ? 'Waiting for player to join...' 
                      : 'Battle concluded!'}
                  </div>
                )}
              </div>

              {/* Players Display */}
              <div className="grid md:grid-cols-3 gap-8 items-center">
                {/* Creator */}
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center text-3xl transition-all duration-1000 ${
                      animationPhase === 'battle' 
                        ? 'border-orange-500 animate-bounce bg-orange-500/20' 
                        : isUserWinner && winner?.address === game.creator
                          ? 'border-neon-green bg-neon-green/20 animate-pulse'
                          : 'border-neon-blue bg-neon-blue/20'
                    }`}>
                      🎴
                    </div>
                    {animationPhase === 'reveal' && game.isCompleted && (
                      <div className="absolute -top-2 -right-2 bg-neon-purple text-white rounded-full w-8 h-8 flex items-center justify-center font-press-start text-xs animate-bounce">
                        #{Number(game.creatorNFTIndex)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="font-press-start text-xs text-neon-pink">Creator</div>
                    <div className="font-press-start text-sm text-white">
                      {shortenAddress(game.creator)}
                    </div>
                    {game.creator.toLowerCase() === userAddress.toLowerCase() && (
                      <div className="font-press-start text-xs text-neon-green">(You)</div>
                    )}
                  </div>
                </div>

                {/* VS / Battle Animation */}
                <div className="text-center space-y-4">
                  <div className={`text-6xl transition-all duration-1000 ${
                    animationPhase === 'battle' 
                      ? 'animate-pulse text-orange-500 scale-150' 
                      : 'text-neon-purple'
                  }`}>
                    {animationPhase === 'battle' ? '⚡' : '⚔️'}
                  </div>
                  <div className="font-press-start text-sm text-neon-purple">
                    {animationPhase === 'battle' ? 'BATTLING...' : 'VS'}
                  </div>
                </div>

                {/* Player */}
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center text-3xl transition-all duration-1000 ${
                      animationPhase === 'battle' 
                        ? 'border-orange-500 animate-bounce bg-orange-500/20' 
                        : isUserWinner && winner?.address === game.player
                          ? 'border-neon-green bg-neon-green/20 animate-pulse'
                          : game.player === '0x0000000000000000000000000000000000000000'
                            ? 'border-gray-500 bg-gray-500/20'
                            : 'border-neon-pink bg-neon-pink/20'
                    }`}>
                      {game.player === '0x0000000000000000000000000000000000000000' ? '❓' : '🎴'}
                    </div>
                    {animationPhase === 'reveal' && game.isCompleted && game.player !== '0x0000000000000000000000000000000000000000' && (
                      <div className="absolute -top-2 -right-2 bg-neon-pink text-white rounded-full w-8 h-8 flex items-center justify-center font-press-start text-xs animate-bounce">
                        #{Number(game.playerNFTIndex)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="font-press-start text-xs text-neon-pink">Player</div>
                    <div className="font-press-start text-sm text-white">
                      {game.player === '0x0000000000000000000000000000000000000000'
                        ? 'Waiting...'
                        : shortenAddress(game.player)
                      }
                    </div>
                    {game.player.toLowerCase() === userAddress.toLowerCase() && (
                      <div className="font-press-start text-xs text-neon-green">(You)</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Battle Results */}
              {showResults && winner && (
                <div className="mt-8 text-center space-y-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-neon-green to-neon-blue rounded-xl blur opacity-75"></div>
                    <div className="relative bg-black rounded-xl p-6 border border-neon-green">
                      <div className="space-y-4">
                        <div className="text-4xl animate-bounce">🏆</div>
                        <h3 className="font-press-start text-xl text-neon-green">
                          {isUserWinner ? 'YOU WON!' : 'BATTLE COMPLETED!'}
                        </h3>
                        <div className="space-y-2">
                          <div className="font-press-start text-sm text-neon-blue">Winner</div>
                          <div className="font-press-start text-lg text-white">
                            {shortenAddress(winner.address)}
                            {winner.address.toLowerCase() === userAddress.toLowerCase() && (
                              <span className="text-neon-green ml-2">(You!)</span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="font-press-start text-sm text-neon-pink">Winning NFT</div>
                          <div className="font-press-start text-lg text-neon-purple">
                            Token #{Number(winner.tokenId)}
                          </div>
                        </div>
                        {isUserParticipant && (
                          <div className={`font-press-start text-sm ${isUserWinner ? 'text-neon-green' : 'text-neon-purple'}`}>
                            {isUserWinner 
                              ? 'You won both NFTs! Check your wallet.' 
                              : 'Better luck next time!'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting State */}
              {game.isActive && !game.isCompleted && game.player === '0x0000000000000000000000000000000000000000' && (
                <div className="mt-8 text-center">
                  <div className="font-press-start text-sm text-neon-blue animate-pulse">
                    Waiting for another player to join this battle...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 