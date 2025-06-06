// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {CadenceRandomConsumer} from "@onflow/flow-sol-utils/src/random/CadenceRandomConsumer.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PackBattles is CadenceRandomConsumer, ERC721Holder, Ownable(msg.sender) {
    event RandomNumberGenerated(uint64 randomNumber, uint64 min, uint64 max);
    event RandomItemSelected(string item, uint256 index);
    event GameCreated(uint256 gameId, address creator);
    event GameJoined(uint256 gameId, address player);
    event GameCompleted(uint256 gameId, address winner, uint256 winningTokenId, uint256 losingTokenId);
    event FeesWithdrawn(address recipient, uint256 amount);
    event FeeRecipientUpdated(address newRecipient);

    error EmptyItemArray();
    error InvalidGameState();
    error GameNotExists();
    error InsufficientPayment();
    error TransferFailed();

    struct Game {
        address creator;
        address player;
        bool isActive;
        bool isCompleted;
        uint256[] availableNFTs;
        uint256 creatorNFTIndex;
        uint256 playerNFTIndex;
    }

    uint256 public constant GAME_FEE = 1 ether; // 1 FLOW
    uint256 public gameCounter;
    mapping(uint256 => Game) public games;
    IERC721 public nftContract;
    uint256[] public availableNFTs;
    uint256 public reservedNFTs;
    address public feeRecipient;
    uint256 public accumulatedFees;

    constructor() {
        nftContract = IERC721(0x84c6a2e6765E88427c41bB38C82a78b570e24709);
        feeRecipient = msg.sender; // Default to contract owner
    }

    function getRandomNumber(uint64 min, uint64 max) public view returns (uint64) {
        return _getRevertibleRandomInRange(min, max);
    }

    function addNFTs(uint256[] calldata tokenIds) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            nftContract.safeTransferFrom(msg.sender, address(this), tokenIds[i]);
            availableNFTs.push(tokenIds[i]);
        }
    }

    function withdrawNFT(uint256 tokenId) external onlyOwner {
        uint256 contractBalance = nftContract.balanceOf(address(this));
        require(contractBalance - reservedNFTs > 0, "Cannot withdraw: All NFTs are reserved for pending games");
        
        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);
        
        // Remove the token from availableNFTs
        for (uint256 i = 0; i < availableNFTs.length; i++) {
            if (availableNFTs[i] == tokenId) {
                availableNFTs[i] = availableNFTs[availableNFTs.length - 1];
                availableNFTs.pop();
                break;
            }
        }
    }

    function createGame() external payable returns (uint256) {
        require(msg.value == GAME_FEE, "Must send exactly 1 FLOW");
        
        uint256 contractBalance = nftContract.balanceOf(address(this));
        require(contractBalance - reservedNFTs >= 2, "Not enough unreserved NFTs available");

        uint256 gameId = gameCounter++;
        games[gameId] = Game({
            creator: msg.sender,
            player: address(0),
            isActive: true,
            isCompleted: false,
            availableNFTs: availableNFTs,
            creatorNFTIndex: 0,
            playerNFTIndex: 0
        });

        // Reserve 2 NFTs for this game
        reservedNFTs += 2;
        
        // Accumulate fees for platform
        accumulatedFees += GAME_FEE;

        emit GameCreated(gameId, msg.sender);
        return gameId;
    }

    function joinGame(uint256 gameId) external payable {
        require(msg.value == GAME_FEE, "Must send exactly 1 FLOW");
        
        Game storage game = games[gameId];
        require(game.isActive && !game.isCompleted, "Game not available");
        require(game.creator != msg.sender, "Cannot join your own game");
        require(game.player == address(0), "Game already has a player");

        game.player = msg.sender;
        
        // Accumulate fees for platform
        accumulatedFees += GAME_FEE;
        
        // Generate random numbers for both players
        uint64 creatorIndex = getRandomNumber(0, uint64(game.availableNFTs.length - 1));
        uint64 playerIndex = getRandomNumber(0, uint64(game.availableNFTs.length - 1));
        
        game.creatorNFTIndex = creatorIndex;
        game.playerNFTIndex = playerIndex;

        uint256 creatorTokenId = game.availableNFTs[creatorIndex];
        uint256 playerTokenId = game.availableNFTs[playerIndex];

        // Determine winner based on token ID
        address winner;
        uint256 winningTokenId;
        if (creatorTokenId > playerTokenId) {
            winner = game.creator;
            winningTokenId = creatorTokenId;
        } else {
            winner = game.player;
            winningTokenId = playerTokenId;
        }

        // Transfer NFT to winner (winner gets both NFTs)
        nftContract.safeTransferFrom(address(this), winner, creatorTokenId);
        nftContract.safeTransferFrom(address(this), winner, playerTokenId);
        
        uint256 losingTokenId = creatorTokenId > playerTokenId ? playerTokenId : creatorTokenId;

        // Remove used NFT from available pool and update counters
        removeNFTFromPool(winningTokenId);
        removeNFTFromPool(losingTokenId);

        reservedNFTs -= 2; // Release the reservation for this game

        game.isCompleted = true;
        game.isActive = false;

        emit GameJoined(gameId, msg.sender);
        emit GameCompleted(gameId, winner, winningTokenId, losingTokenId);
    }

    function removeNFTFromPool(uint256 tokenId) internal {
        for (uint256 i = 0; i < availableNFTs.length; i++) {
            if (availableNFTs[i] == tokenId) {
                availableNFTs[i] = availableNFTs[availableNFTs.length - 1];
                availableNFTs.pop();
                break;
            }
        }
    }

    /**
     * @dev Set the address that will receive platform fees
     * @param newRecipient The address to receive fees
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Fee recipient cannot be zero address");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    /**
     * @dev Withdraw accumulated platform fees to the designated recipient
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        
        accumulatedFees = 0;
        
        (bool sent, ) = feeRecipient.call{value: amount}("");
        require(sent, "Failed to send fees");
        
        emit FeesWithdrawn(feeRecipient, amount);
    }

    /**
     * @dev Get the current accumulated fees
     */
    function getAccumulatedFees() external view returns (uint256) {
        return accumulatedFees;
    }

    function getAvailableNFTs() external view returns (uint256[] memory) {
        return availableNFTs;
    }

    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    function getUnreservedNFTCount() external view returns (uint256) {
        uint256 contractBalance = nftContract.balanceOf(address(this));
        return contractBalance - reservedNFTs;
    }
}