// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {CadenceRandomConsumer} from "@onflow/flow-sol-utils/src/random/CadenceRandomConsumer.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PackOpening is CadenceRandomConsumer, ERC721Holder, Ownable(msg.sender) {

    event RandomNumberGenerated(uint64 randomNumber, uint64 min, uint64 max);
    event RandomItemSelected(string item, uint256 index);
    event PackOpened(uint256 indexed round, address indexed player, uint256 tokenId);
    event NFTsAdded(uint256[] tokenIds);
    event NFTWithdrawn(uint256 tokenId);

    error EmptyItemArray();
    error InsufficientPayment();
    error NoNFTsAvailable();
    error TransferFailed();

    struct PackOpeningRecord {
        uint256 round;
        address player;
        uint256 tokenId;
        uint256 timestamp;
    }

    uint256 public constant PACK_COST = 1 ether; // 1 FLOW
    uint256 public constant MAX_PACK_SIZE = 15;
    
    uint256 public currentRound;
    uint256[] public availableNFTs;
    IERC721 public nftContract;
    
    // Mapping from round to pack opening record
    mapping(uint256 => PackOpeningRecord) public packOpeningRecords;
    
    // Array to store all pack opening records for easy access
    PackOpeningRecord[] public allPackOpenings;

    constructor() {
        nftContract = IERC721(0x84c6a2e6765E88427c41bB38C82a78b570e24709);
        currentRound = 1;
    }

    function getRandomNumber(uint64 min, uint64 max) public view returns (uint64) {
        return _getRevertibleRandomInRange(min, max);
    }
    
    function selectRandomItem(string[] calldata items) public view returns (string memory) {
        if (items.length == 0) {
            revert EmptyItemArray();
        }
        
        uint64 randomIndex = getRandomNumber(0, uint64(items.length - 1));
        return items[randomIndex];
    }

    /**
     * @dev Add NFTs to the pack pool. Only owner can call this.
     * @param tokenIds Array of NFT token IDs to add to the pack
     */
    function addNFTs(uint256[] calldata tokenIds) external onlyOwner {
        require(tokenIds.length <= MAX_PACK_SIZE, "Cannot add more than 15 NFTs at once");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            nftContract.safeTransferFrom(msg.sender, address(this), tokenIds[i]);
            availableNFTs.push(tokenIds[i]);
        }
        
        emit NFTsAdded(tokenIds);
    }

    /**
     * @dev Withdraw an NFT from the pack pool. Only owner can call this.
     * @param tokenId The token ID to withdraw
     */
    function withdrawNFT(uint256 tokenId) external onlyOwner {
        // Find and remove the token from availableNFTs
        for (uint256 i = 0; i < availableNFTs.length; i++) {
            if (availableNFTs[i] == tokenId) {
                // Move the last element to the current position and remove the last element
                availableNFTs[i] = availableNFTs[availableNFTs.length - 1];
                availableNFTs.pop();
                break;
            }
        }
        
        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);
        emit NFTWithdrawn(tokenId);
    }

    /**
     * @dev Open a pack and receive a random NFT
     */
    function openPack() external payable returns (uint256) {
        require(msg.value == PACK_COST, "Must send exactly 1 FLOW");
        require(availableNFTs.length > 0, "No NFTs available in pack");

        // Generate random index to select NFT
        uint64 randomIndex = getRandomNumber(0, uint64(availableNFTs.length - 1));
        uint256 selectedTokenId = availableNFTs[randomIndex];

        // Remove the selected NFT from available pool
        availableNFTs[randomIndex] = availableNFTs[availableNFTs.length - 1];
        availableNFTs.pop();

        // Transfer the NFT to the player
        nftContract.safeTransferFrom(address(this), msg.sender, selectedTokenId);

        // Record the pack opening
        PackOpeningRecord memory record = PackOpeningRecord({
            round: currentRound,
            player: msg.sender,
            tokenId: selectedTokenId,
            timestamp: block.timestamp
        });

        packOpeningRecords[currentRound] = record;
        allPackOpenings.push(record);

        emit PackOpened(currentRound, msg.sender, selectedTokenId);

        currentRound++;
        return selectedTokenId;
    }

    /**
     * @dev Get the list of available NFT token IDs
     */
    function getAvailableNFTs() external view returns (uint256[] memory) {
        return availableNFTs;
    }

    /**
     * @dev Get the number of available NFTs
     */
    function getAvailableNFTCount() external view returns (uint256) {
        return availableNFTs.length;
    }

    /**
     * @dev Get pack opening record by round
     */
    function getPackOpeningRecord(uint256 round) external view returns (PackOpeningRecord memory) {
        return packOpeningRecords[round];
    }

    /**
     * @dev Get all pack opening records
     */
    function getAllPackOpenings() external view returns (PackOpeningRecord[] memory) {
        return allPackOpenings;
    }

    /**
     * @dev Get pack opening records for a specific player
     */
    function getPlayerPackOpenings(address player) external view returns (PackOpeningRecord[] memory) {
        uint256 count = 0;
        
        // First, count how many records belong to the player
        for (uint256 i = 0; i < allPackOpenings.length; i++) {
            if (allPackOpenings[i].player == player) {
                count++;
            }
        }
        
        // Create array with the correct size
        PackOpeningRecord[] memory playerRecords = new PackOpeningRecord[](count);
        uint256 index = 0;
        
        // Fill the array with player's records
        for (uint256 i = 0; i < allPackOpenings.length; i++) {
            if (allPackOpenings[i].player == player) {
                playerRecords[index] = allPackOpenings[i];
                index++;
            }
        }
        
        return playerRecords;
    }

    /**
     * @dev Withdraw collected FLOW from pack openings. Only owner can call this.
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "Failed to send FLOW");
    }

    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}