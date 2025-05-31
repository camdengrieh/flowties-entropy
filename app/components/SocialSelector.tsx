'use client';

import { useState } from 'react';
import { selectRandomItem } from '../utils/contracts';
import { getTweetInteractions, extractTweetId } from '../utils/twitter';
import ResultCard from './ResultCard';
import WinnerModal from './WinnerModal';

interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

interface TweetInfo {
  id: string;
  text: string;
  author: {
    id: string;
    username: string;
    name: string;
  };
  stats: {
    retweets: number;
    likes: number;
  };
}

interface CriteriaCounts {
  follows: number;
  retweets: number;
  shares: number;
  total: number;
}

export default function SocialSelector() {
  const [tweetUrl, setTweetUrl] = useState<string>('');
  const [criteria, setCriteria] = useState({
    follows: false,
    retweets: false,
    shares: false,
  });
  const [numWinners, setNumWinners] = useState<number>(1);
  const [winners, setWinners] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showWinners, setShowWinners] = useState(false);
  const [participants, setParticipants] = useState<TwitterUser[]>([]);
  const [interactionSummary, setInteractionSummary] = useState('');
  const [tweetInfo, setTweetInfo] = useState<TweetInfo | null>(null);
  const [criteriaCounts, setCriteriaCounts] = useState<CriteriaCounts | null>(null);
  const [isFollowerFetching, setIsFollowerFetching] = useState(false);

  const validateTweetUrl = (url: string): boolean => {
    return extractTweetId(url) !== null;
  };

  const handleCriteriaChange = (key: 'follows' | 'retweets' | 'shares') => {
    setCriteria(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const generateCriteriaSummary = () => {
    if (!criteriaCounts) return '';
    
    const parts = [];
    if (criteria.follows && criteriaCounts.follows > 0) {
      parts.push(`${criteriaCounts.follows} followers`);
    }
    if (criteria.retweets && criteriaCounts.retweets > 0) {
      parts.push(`${criteriaCounts.retweets} retweeters`);
    }
    if (criteria.shares && criteriaCounts.shares > 0) {
      parts.push(`${criteriaCounts.shares} likers`);
    }
    
    if (parts.length === 0) return 'No matching participants found';
    
    return `Found ${criteriaCounts.total} unique participants (${parts.join(', ')})`;
  };

  const findWinners = async () => {
    if (!tweetUrl) {
      setError('Please enter a Tweet URL');
      return;
    }

    if (!validateTweetUrl(tweetUrl)) {
      setError('Please enter a valid Twitter/X post URL');
      return;
    }

    if (!criteria.follows && !criteria.retweets && !criteria.shares) {
      setError('Please select at least one interaction criteria');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setWinners([]);
      setShowWinners(false);
      setTweetInfo(null);
      setCriteriaCounts(null);
      setInteractionSummary('');
      
      if (criteria.follows) {
        setIsFollowerFetching(true);
        setInteractionSummary('Fetching followers (this may take longer)...');
      }
      
      // Get participants based on selected criteria
      const response = await getTweetInteractions(tweetUrl, criteria);
      setIsFollowerFetching(false);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch data');
      }
      
      const eligibleUsers = response.users as TwitterUser[];
      setParticipants(eligibleUsers);
      
      if ('tweetInfo' in response) {
        setTweetInfo(response.tweetInfo as TweetInfo);
      }
      
      if ('counts' in response) {
        setCriteriaCounts(response.counts as CriteriaCounts);
      }
      
      // Set interaction summary
      const tweetId = extractTweetId(tweetUrl);
      
      if (eligibleUsers.length === 0) {
        setError('No users found matching the selected criteria');
        return;
      }
      
      // Select winners
      const selectedWinners = [];
      const availableParticipants = [...eligibleUsers.map(user => user.username)];
      
      if (availableParticipants.length === 0) {
        setError('No users found matching the selected criteria');
        return;
      }
      
      // Make sure we don't try to select more winners than available participants
      const winnersToSelect = Math.min(numWinners, availableParticipants.length);
      console.log(`Attempting to select ${winnersToSelect} winners from ${availableParticipants.length} participants`);
      
      try {
        // If only one winner needed or just one participant, handle directly
        if (winnersToSelect === 1 || availableParticipants.length === 1) {
          const winner = availableParticipants.length === 1 
            ? availableParticipants[0] 
            : await selectRandomItem(availableParticipants);
          
          selectedWinners.push(winner);
        } else {
          // For multiple winners, select one by one to avoid issues
          const tempParticipants = [...availableParticipants];
          
          for (let i = 0; i < winnersToSelect; i++) {
            // Use the contract's random selection for true randomness
            const winner = await selectRandomItem(tempParticipants);
            selectedWinners.push(winner);
            
            // Remove the selected winner from the temporary pool
            const index = tempParticipants.indexOf(winner);
            if (index > -1) {
              tempParticipants.splice(index, 1);
            }
          }
        }
        
        console.log(`Successfully selected ${selectedWinners.length} winners:`, selectedWinners);
        setWinners(selectedWinners);
        setShowWinners(true);
      } catch (error) {
        console.error('Error selecting winners:', error);
        setError('Failed to select winners: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } catch (error) {
      console.error('Error selecting winners:', error);
      setError(error instanceof Error ? error.message : 'Failed to select winners');
      setParticipants([]);
      setInteractionSummary('');
      setIsFollowerFetching(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <label className="block font-press-start text-xs text-neon-blue">
          Tweet URL
        </label>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-pink to-neon-blue rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative">
            <input
              type="url"
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
              className="w-full px-4 py-4 bg-black/50 rounded-xl border border-neon-purple/20 focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 focus:outline-none text-neon-green font-press-start text-sm transition-all duration-300"
              placeholder="https://twitter.com/username/status/1234567890"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block font-press-start text-xs text-neon-blue">
          Interaction Criteria
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="checkbox"
              id="follows"
              checked={criteria.follows}
              onChange={() => handleCriteriaChange('follows')}
              className="sr-only"
            />
            <label
              htmlFor="follows"
              className={`
                block w-full px-4 py-4 rounded-xl border text-center font-press-start text-sm cursor-pointer transition-all duration-300
                ${criteria.follows 
                  ? 'bg-neon-purple/20 border-neon-purple text-neon-purple' 
                  : 'bg-black/50 border-neon-purple/20 text-white hover:border-neon-purple/50'}
              `}
            >
              Follows
              {criteriaCounts?.follows ? <span className="block mt-1 text-xs">({criteriaCounts.follows})</span> : ''}
            </label>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              id="retweets"
              checked={criteria.retweets}
              onChange={() => handleCriteriaChange('retweets')}
              className="sr-only"
            />
            <label
              htmlFor="retweets"
              className={`
                block w-full px-4 py-4 rounded-xl border text-center font-press-start text-sm cursor-pointer transition-all duration-300
                ${criteria.retweets 
                  ? 'bg-neon-pink/20 border-neon-pink text-neon-pink' 
                  : 'bg-black/50 border-neon-purple/20 text-white hover:border-neon-pink/50'}
              `}
            >
              Retweets
              {criteriaCounts?.retweets ? <span className="block mt-1 text-xs">({criteriaCounts.retweets})</span> : ''}
            </label>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              id="shares"
              checked={criteria.shares}
              onChange={() => handleCriteriaChange('shares')}
              className="sr-only"
            />
            <label
              htmlFor="shares"
              className={`
                block w-full px-4 py-4 rounded-xl border text-center font-press-start text-sm cursor-pointer transition-all duration-300
                ${criteria.shares 
                  ? 'bg-neon-blue/20 border-neon-blue text-neon-blue' 
                  : 'bg-black/50 border-neon-purple/20 text-white hover:border-neon-blue/50'}
              `}
            >
              Likes
              {criteriaCounts?.shares ? <span className="block mt-1 text-xs">({criteriaCounts.shares})</span> : ''}
            </label>
          </div>
        </div>
        <p className="font-press-start text-xs text-neon-purple/70 text-center mt-2">
          Note: Fetching followers may take longer
        </p>
      </div>

      <div className="space-y-3">
        <label className="block font-press-start text-xs text-neon-blue">
          Number of Winners
        </label>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={numWinners}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty input temporarily while typing
                if (value === '') {
                  setNumWinners(1); // Keep state at 1 but allow field to be cleared visually
                  e.target.value = '';
                } else {
                  const num = parseInt(value, 10);
                  if (!isNaN(num)) {
                    setNumWinners(Math.max(1, num));
                  }
                }
              }}
              className="w-full px-4 py-4 bg-black/50 rounded-xl border border-neon-purple/20 focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 focus:outline-none text-neon-green font-press-start text-sm transition-all duration-300"
              placeholder="1"
            />
          </div>
        </div>
      </div>

      <button
        onClick={findWinners}
        disabled={loading}
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
              <span>{isFollowerFetching ? 'Fetching followers...' : 'Scraping tweet data...'}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Find Eligible Participants</span>
            </>
          )}
        </div>
      </button>

      {interactionSummary && !error && (
        <div className="bg-neon-blue/10 border border-neon-blue/30 rounded-xl p-4 text-neon-blue text-center font-press-start text-sm animate-pulse">
          {interactionSummary}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6 text-red-400 text-center font-press-start text-sm animate-pulse">
          {error}
        </div>
      )}

      {participants.length > 0 && !error && !showWinners && (
        <ResultCard type="list">
          <div className="font-press-start text-sm text-neon-green animate-glow">
            {tweetInfo && (
              <div className="mb-4 p-3 bg-black/40 rounded-lg border border-neon-blue/30">
                <div className="flex justify-between items-start">
                  <div className="text-neon-blue font-bold">{tweetInfo.author.username}</div>
                  <div className="text-xs text-neon-purple/80">
                    <span className="mr-2">💙 {tweetInfo.stats.likes}</span>
                    <span>🔄 {tweetInfo.stats.retweets}</span>
                  </div>
                </div>
                <div className="mt-2 text-white text-xs line-clamp-2">
                  {tweetInfo.text}
                </div>
              </div>
            )}
            
            <p className="mb-2 text-neon-blue">{generateCriteriaSummary()}</p>
            <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-neon-purple scrollbar-track-black/20 pr-2 mt-4">
              <div className="grid grid-cols-1 gap-2">
                {participants.slice(0, 10).map((user, index) => (
                  <div key={index} className="bg-black/30 p-2 rounded border border-neon-purple/20 flex justify-between items-center">
                    <div className="text-neon-green">{user.username}</div>
                    <div className="text-neon-pink/70 text-xs truncate ml-2 max-w-[150px]">{user.name}</div>
                  </div>
                ))}
                {participants.length > 10 && (
                  <div className="text-neon-purple p-2 text-center">
                    + {participants.length - 10} more participants
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  if (participants.length > 0) {
                    findWinners();
                  }
                }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple to-neon-pink rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative px-6 py-2 bg-black rounded-lg font-press-start text-xs text-white group-hover:text-neon-pink transition-all duration-300">
                  Draw {numWinners} Winner{numWinners > 1 ? 's' : ''}
                </div>
              </button>
            </div>
          </div>
        </ResultCard>
      )}

      {/* Winners Modal */}
      {showWinners && winners.length > 0 && (
        <WinnerModal winners={winners} onClose={() => setShowWinners(false)} />
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
                The Social Selector uses Apify's Twitter Scrapers and Flow's VRF to randomly select winners from tweet interactions:
              </p>
              <ul className="list-disc list-inside space-y-2 text-white">
                <li>Enter a tweet URL from Twitter (now X)</li>
                <li>Select interaction criteria (Follows, Retweets, Likes)</li>
                <li>Choose how many winners to select</li>
                <li>Flow's VRF ensures fair and provably random selection</li>
              </ul>
              <div className="pt-4 space-y-2">
                <p className="text-neon-pink">Note about Twitter scraping:</p>
                <ul className="list-disc list-inside text-white">
                  <li>Uses multiple Apify scrapers to get all interaction data</li>
                  <li>Collecting follower data may take longer to process</li>
                  <li>Private accounts and some older tweets may not be accessible</li>
                  <li>For large accounts, we limit to the most recent 200 followers</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 