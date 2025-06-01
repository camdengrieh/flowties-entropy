import { ethers } from "hardhat";
import { PackOpening } from "../typechain-types";

async function main() {
  // Get the deployed contract address (you'll need to replace this with actual address)
  const [deployer] = await ethers.getSigners();
  const packOpening = await ethers.getContractAt("PackOpening", "REPLACE_WITH_DEPLOYED_ADDRESS") as PackOpening;
  
  // Check if there are NFTs available
  const availableNFTCount = await packOpening.getAvailableNFTCount();
  if (availableNFTCount === 0n) {
    console.error("No NFTs available in the pack!");
    process.exit(1);
  }

  console.log(`Available NFTs in pack: ${availableNFTCount}`);

  // Get the pack cost
  const packCost = await packOpening.PACK_COST();
  console.log(`Pack cost: ${ethers.formatEther(packCost)} FLOW`);

  try {
    // Open a pack by sending the required fee
    console.log("Opening pack...");
    const tx = await packOpening.openPack({ value: packCost });
    const receipt = await tx.wait();
    
    if (receipt) {
      // Get the PackOpened event from the receipt
      const packOpenedEvents = receipt.logs.filter(
        (log) => log.topics[0] === packOpening.interface.getEvent("PackOpened").topicHash
      );

      if (packOpenedEvents.length > 0) {
        const event = packOpenedEvents[0];
        const parsedLog = packOpening.interface.parseLog({
          topics: event.topics,
          data: event.data
        });
        
        if (parsedLog) {
          const [round, player, tokenId] = parsedLog.args;
          console.log(`\n🎉 Pack opened successfully!`);
          console.log(`Round: ${round}`);
          console.log(`Player: ${player}`);
          console.log(`Won NFT Token ID: ${tokenId}`);
          
          // Get updated pack info
          const remainingNFTs = await packOpening.getAvailableNFTCount();
          console.log(`Remaining NFTs in pack: ${remainingNFTs}`);
        }
      }
    }
  } catch (error) {
    console.error("Error opening pack:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 