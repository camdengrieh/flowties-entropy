'use client';

import { NextRequest } from 'next/server';

// Define interfaces for Twitter user data
interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

interface TweetData {
  id: string;
  author_id: string;
  author_username: string;
  text: string;
  retweet_count: number;
  like_count: number;
}

// Apify response interfaces
interface ApifyTweetData {
  tweet: {
    id_str: string;
    user: {
      id_str: string;
      screen_name: string;
      name: string;
    };
    retweet_count: number;
    favorite_count: number;
    text: string;
  };
  likes?: {
    screen_name: string;
    name: string;
    id_str: string;
  }[];
  retweets?: {
    screen_name: string;
    name: string;
    id_str: string;
  }[];
}

interface ApifyFollowerData {
  username: string;
  name: string;
  userId: string;
}

// Extract the tweet ID from a Twitter URL
export function extractTweetId(tweetUrl: string): string | null {
  const regex = /twitter\.com\/\w+\/status\/(\d+)|x\.com\/\w+\/status\/(\d+)/;
  const match = tweetUrl.match(regex);
  
  if (match) {
    return match[1] || match[2];
  }
  
  return null;
}

// Extract username from a Twitter URL
export function extractUsername(tweetUrl: string): string | null {
  const regex = /twitter\.com\/([^/]+)\/status\/|x\.com\/([^/]+)\/status\//;
  const match = tweetUrl.match(regex);
  
  if (match) {
    return match[1] || match[2];
  }
  
  return null;
}

// Fetch users who meet specified criteria for a tweet
export async function getTweetInteractions(
  tweetUrl: string,
  criteria: { follows: boolean; retweets: boolean; shares: boolean }
): Promise<any> {
  try {
    console.log(`Getting tweet interactions for: ${tweetUrl}`);
    console.log(`Selected criteria: follows=${criteria.follows}, retweets=${criteria.retweets}, shares=${criteria.shares}`);
    
    const tweetId = extractTweetId(tweetUrl);
    
    if (!tweetId) {
      throw new Error('Invalid tweet URL');
    }
    
    // Make API call to our Next.js API route that uses Apify
    const response = await fetch('/api/twitter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tweetUrl,
        criteria,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch tweet interactions');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch tweet interactions');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching tweet interactions:', error);
    throw error;
  }
}

// Function to call Apify's Twitter Scraper Lite for tweet info, likes, and retweets
export async function scrapeTweetData(tweetUrl: string): Promise<ApifyTweetData> {
  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  
  if (!APIFY_API_TOKEN) {
    throw new Error('Apify API token not configured');
  }
  
  const apifyUrl = `https://api.apify.com/v2/acts/apidojo~twitter-scraper-lite/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
  
  const response = await fetch(apifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tweetUrl: tweetUrl,
      collectLikes: true,
      collectRetweets: true,
      collectReplies: false,
      includeUserInfo: true
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Apify Twitter Scraper request failed with status: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No data returned from Apify Twitter Scraper');
  }
  
  return data[0] as ApifyTweetData;
}

// Function to scrape followers using Apify's Twitter Followers Scraper
export async function scrapeFollowers(username: string): Promise<TwitterUser[]> {
  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  
  if (!APIFY_API_TOKEN) {
    throw new Error('Apify API token not configured');
  }
  
  const apifyUrl = `https://api.apify.com/v2/acts/quacker~twitter-followers-scraper/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
  
  const response = await fetch(apifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username,
      maxFollowers: 200, // Limit for performance reasons
      labels: ["followers"]
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Apify Followers Scraper request failed with status: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data)) {
    throw new Error('Invalid response from Apify Followers Scraper');
  }
  
  // Map to our TwitterUser format
  return data.map((follower: ApifyFollowerData) => ({
    id: follower.userId || `id_${follower.username}`, // Some users might not have an ID
    username: `@${follower.username}`,
    name: follower.name || follower.username // Some users might not have a name
  }));
}

// This function handles Twitter scraping requests through Apify
export async function twitterApiHandler(req: NextRequest) {
  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  
  if (!APIFY_API_TOKEN) {
    throw new Error('Apify API token not configured');
  }
  
  const { tweetUrl, criteria } = await req.json();
  
  try {
    // First, use the Twitter Scraper Lite to get the tweet data, likes, and retweets
    const tweetData = await scrapeTweetData(tweetUrl);
    
    if (!tweetData || !tweetData.tweet) {
      throw new Error('Failed to fetch tweet data');
    }
    
    // Extract tweet and author info
    const tweet = tweetData.tweet;
    const tweetAuthor = tweet.user;
    
    // Initialize collections for each criteria
    const follows: TwitterUser[] = [];
    const retweets: TwitterUser[] = [];
    const shares: TwitterUser[] = [];
    
    // Process data for retweets and likes (shares)
    if (criteria.retweets && tweetData.retweets) {
      retweets.push(...tweetData.retweets.map(user => ({
        id: user.id_str,
        username: `@${user.screen_name}`,
        name: user.name
      })));
    }
    
    if (criteria.shares && tweetData.likes) {
      shares.push(...tweetData.likes.map(user => ({
        id: user.id_str,
        username: `@${user.screen_name}`,
        name: user.name
      })));
    }
    
    // For followers, use a separate Apify actor if needed
    if (criteria.follows) {
      try {
        const authorUsername = tweetAuthor.screen_name;
        const followerData = await scrapeFollowers(authorUsername);
        follows.push(...followerData);
      } catch (error) {
        console.error('Error fetching followers:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching followers';
        throw new Error(`Failed to fetch followers: ${errorMessage}`);
      }
    }
    
    // Combine and deduplicate users
    const userMap = new Map<string, TwitterUser>();
    
    [...follows, ...retweets, ...shares].forEach(user => {
      userMap.set(user.id, user);
    });
    
    const uniqueUsers = Array.from(userMap.values());
    
    return { 
      success: true, 
      users: uniqueUsers,
      tweetInfo: {
        id: tweet.id_str,
        text: tweet.text,
        author: {
          id: tweetAuthor.id_str,
          username: `@${tweetAuthor.screen_name}`,
          name: tweetAuthor.name
        },
        stats: {
          retweets: tweet.retweet_count,
          likes: tweet.favorite_count
        }
      },
      counts: {
        follows: follows.length,
        retweets: retweets.length,
        shares: shares.length,
        total: uniqueUsers.length
      }
    };
  } catch (error) {
    console.error('Error processing Twitter scraping request:', error);
    throw error;
  }
} 