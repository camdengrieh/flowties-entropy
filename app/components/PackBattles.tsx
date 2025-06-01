'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import type { PackBattles } from '../../typechain-types';
import { shortenAddress } from '../utils/address';
import GameDetail from './GameDetail';

interface Game {
  id: number;
  creator: string;
  player: string;
  isActive: boolean;
  isCompleted: boolean;
  creatorNFTIndex: bigint;
  playerNFTIndex: bigint;
}

const PACK_BATTLES_ADDRESS = "0x9b4568cE546c1c54f15720783FE1744C20fF1914";

export default function PackBattles() {
  const [loading, setLoading] = useState(false);
  const [joiningGame, setJoiningGame] = useState<number | null>(null);
  const [creatingGame, setCreatingGame] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [userAddress, setUserAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGameDetail, setShowGameDetail] = useState(false);
  const [animatingToDetail, setAnimatingToDetail] = useState(false);

  useEffect(() => {
    connectWallet();
    loadGames();
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet');
    }
  };

  const getContract = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No ethereum provider found');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(PACK_BATTLES_ADDRESS, [
      "function createGame() external payable returns (uint256)",
      "function joinGame(uint256 gameId) external payable",
      "function getGame(uint256 gameId) external view returns (tuple(address creator, address player, bool isActive, bool isCompleted, uint256[] availableNFTs, uint256 creatorNFTIndex, uint256 playerNFTIndex))",
      "function gameCounter() external view returns (uint256)",
      "function GAME_FEE() external view returns (uint256)",
      "event GameCreated(uint256 gameId, address creator)",
      "event GameJoined(uint256 gameId, address player)",
      "event GameCompleted(uint256 gameId, address winner, uint256 winningTokenId, uint256 losingTokenId)"
    ], signer);
  };

  const loadGames = async () => {
    try {
      const contract = await getContract();
      const gameCounter = await contract.gameCounter();
      const gameList: Game[] = [];

      // Load recent games (last 10)
      const start = Math.max(0, Number(gameCounter) - 10);
      for (let i = start; i < Number(gameCounter); i++) {
        try {
          const gameData = await contract.getGame(i);
          gameList.push({
            id: i,
            creator: gameData.creator,
            player: gameData.player,
            isActive: gameData.isActive,
            isCompleted: gameData.isCompleted,
            creatorNFTIndex: gameData.creatorNFTIndex,
            playerNFTIndex: gameData.playerNFTIndex
          });
        } catch (error) {
          console.error(`Error loading game ${i}:`, error);
        }
      }

      setGames(gameList.reverse()); // Show newest first
    } catch (error) {
      console.error('Error loading games:', error);
      setError('Failed to load games');
    }
  };

  const createGame = async () => {
    try {
      setCreatingGame(true);
      setError(null);

      const contract = await getContract();
      const gameFee = await contract.GAME_FEE();
      
      const tx = await contract.createGame({ value: gameFee });
      const receipt = await tx.wait();

      if (receipt) {
        // Parse the GameCreated event
        const gameCreatedEvent = receipt.logs.find(
          (log: any) => log.topics[0] === ethers.id("GameCreated(uint256,address)")
        );

        if (gameCreatedEvent) {
          const gameId = ethers.toBigInt(gameCreatedEvent.topics[1]);
          
          // Animate to game detail page
          setAnimatingToDetail(true);
          setTimeout(async () => {
            const gameData = await contract.getGame(gameId);
            setSelectedGame({
              id: Number(gameId),
              creator: gameData.creator,
              player: gameData.player,
              isActive: gameData.isActive,
              isCompleted: gameData.isCompleted,
              creatorNFTIndex: gameData.creatorNFTIndex,
              playerNFTIndex: gameData.playerNFTIndex
            });
            setShowGameDetail(true);
            setAnimatingToDetail(false);
          }, 500);
        }
      }

      await loadGames();
    } catch (error) {
      console.error('Error creating game:', error);
      setError(error instanceof Error ? error.message : 'Failed to create game');
    } finally {
      setCreatingGame(false);
    }
  };

  const joinGame = async (gameId: number) => {
    try {
      setJoiningGame(gameId);
      setError(null);

      const contract = await getContract();
      const gameFee = await contract.GAME_FEE();
      
      const tx = await contract.joinGame(gameId, { value: gameFee });
      const receipt = await tx.wait();

      if (receipt) {
        // Animate to game detail page
        setAnimatingToDetail(true);
        setTimeout(async () => {
          const gameData = await contract.getGame(gameId);
          setSelectedGame({
            id: gameId,
            creator: gameData.creator,
            player: gameData.player,
            isActive: gameData.isActive,
            isCompleted: gameData.isCompleted,
            creatorNFTIndex: gameData.creatorNFTIndex,
            playerNFTIndex: gameData.playerNFTIndex
          });
          setShowGameDetail(true);
          setAnimatingToDetail(false);
        }, 500);
      }

      await loadGames();
    } catch (error) {
      console.error('Error joining game:', error);
      setError(error instanceof Error ? error.message : 'Failed to join game');
    } finally {
      setJoiningGame(null);
    }
  };

  const getPlayerLabel = (game: Game, address: string): string => {
    if (game.creator.toLowerCase() === address.toLowerCase()) {
      return shortenAddress(game.creator);
    }
    if (game.player && game.player !== '0x0000000000000000000000000000000000000000') {
      return shortenAddress(game.player);
    }
    return 'Waiting...';
  };

  const canJoinGame = (game: Game): boolean => {
    return game.isActive && 
           !game.isCompleted && 
           game.player === '0x0000000000000000000000000000000000000000' &&
           game.creator.toLowerCase() !== userAddress.toLowerCase();
  };

  // Restore GameDetail component usage
  if (showGameDetail && selectedGame) {
    return (
      <GameDetail 
        game={selectedGame} 
        userAddress={userAddress}
        onBack={() => {
          setShowGameDetail(false);
          setSelectedGame(null);
          loadGames();
        }} 
      />
    );
  }

  return (
    <div className={`space-y-6 transition-all duration-500 ${animatingToDetail ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="font-press-start text-2xl text-neon-blue">Pack Battles</h2>
        <p className="font-press-start text-sm text-neon-purple">
          Create or join NFT pack battles - Winner takes all!
        </p>
      </div>

      {/* Create Game Button */}
      <button
        onClick={createGame}
        disabled={creatingGame || !userAddress}
        className="relative w-full group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-1000 group-disabled:opacity-25 animate-gradient"></div>
        <div className="relative px-6 py-4 bg-black rounded-xl flex items-center justify-center gap-3 font-press-start text-sm text-white group-hover:text-neon-blue transition-all duration-300 group-disabled:cursor-not-allowed">
          {creatingGame ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Creating Game...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Battle Pack</span>
            </>
          )}
        </div>
      </button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 text-red-400 text-center font-press-start text-sm animate-pulse">
          {error}
        </div>
      )}

      {/* Games List */}
      <div className="space-y-4">
        <h3 className="font-press-start text-lg text-neon-green">Active Games</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 text-neon-blue mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-8 text-neon-purple font-press-start text-sm">
            No games available. Create the first battle pack!
          </div>
        ) : (
          <div className="grid gap-4">
            {games.map((game) => (
              <div
                key={game.id}
                className="relative group cursor-pointer"
                onClick={() => {
                  setSelectedGame(game);
                  setShowGameDetail(true);
                }}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-black/50 rounded-xl p-4 border border-neon-purple/20">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-press-start text-sm text-neon-blue">
                      Game #{game.id}
                    </div>
                    <div className={`font-press-start text-xs px-2 py-1 rounded ${
                      game.isCompleted 
                        ? 'bg-neon-green/20 text-neon-green' 
                        : game.isActive 
                          ? 'bg-neon-purple/20 text-neon-purple' 
                          : 'bg-red-500/20 text-red-400'
                    }`}>
                      {game.isCompleted ? 'Completed' : game.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="space-y-1">
                      <div className="font-press-start text-xs text-neon-pink">Creator</div>
                      <div className="font-press-start text-sm text-white">
                        {getPlayerLabel(game, game.creator)}
                      </div>
                    </div>
                    <div className="text-2xl">⚔️</div>
                    <div className="space-y-1 text-right">
                      <div className="font-press-start text-xs text-neon-pink">Player</div>
                      <div className="font-press-start text-sm text-white">
                        {game.player && game.player !== '0x0000000000000000000000000000000000000000'
                          ? shortenAddress(game.player)
                          : 'Waiting...'
                        }
                      </div>
                    </div>
                  </div>

                  {canJoinGame(game) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        joinGame(game.id);
                      }}
                      disabled={joiningGame === game.id}
                      className="relative w-full group/join"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg blur opacity-50 group-hover/join:opacity-100 transition duration-1000"></div>
                      <div className="relative px-4 py-2 bg-black rounded-lg font-press-start text-xs text-white group-hover/join:text-neon-green transition-all duration-300">
                        {joiningGame === game.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4 inline mr-2" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Joining...
                          </>
                        ) : (
                          'Join Battle'
                        )}
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 