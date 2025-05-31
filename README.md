# Randomness.WTF

A decentralized random number generator using on-chain VRF (Verifiable Random Function) across multiple blockchains.

## Features

- Generate random numbers within a specified range
- Select random items from a list
- True randomness powered by blockchain VRF
- Social media giveaway selector for picking winners from Twitter interactions

## Tech Stack

- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- Solidity
- Hardhat
- Multiple Blockchains
- Apify Twitter Scraper

## Getting Started

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/random.wtf.git && cd random.wtf
    ```

1. Install dependencies:
    ```bash
    npm install
    ```

1. Compile the contracts and generate TypeScript bindings
    ```bash
    npm hardhat compile
    ```

1. Set up environment variables:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and add your private keys and Apify API token.

1. Deploy the smart contract:
    ```bash
    npx hardhat run scripts/deploy.ts --network testnet
    ```

1. Run the development server:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Apify Setup

To use the Social feature for selecting winners from Twitter interactions, you need to set up Apify:

1. Create an account at [apify.com](https://apify.com)
2. Get your API token from your account settings
3. Add the token to your `.env.local` file:

```
APIFY_API_TOKEN=your_api_token_here
```

The Social feature allows influencers to:
- Enter a tweet URL
- Select interaction criteria (follows, retweets, likes)
- Specify the number of winners to select
- Randomly choose winners using blockchain VRF

## Running Tests

To run the Hardhat test suite, execute the command:

```bash
npx hardhat test test/*.test.ts
```

## Smart Contract

The `RandomnessWTF` contract is deployed on multiple testnets
and uses VRF capabilities to generate true random numbers. The contract provides two main functions:

- `getRandomNumber(uint256 min, uint256 max)`: Generates a random number within the specified range
- `selectRandomItem(string[] items)`: Selects a random item from an array of strings

## Resources

For more about using VRF in your contracts, check out the resources below:

- [VRF in Solidity](https://docs.chain.link/vrf)
- [VRF Examples](https://en.wikipedia.org/wiki/Verifiable_random_function)
- [Commit-Reveal Example Repo](https://github.com/ChainSafe/randomness-examples)
- [Apify Twitter Scraper Documentation](https://apify.com/apidojo/twitter-scraper-lite)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)