import { ethers } from "hardhat";
import { PackBattles } from "../typechain-types";

async function main() {
  // Get the deployed contract address from the deployment script
  const [deployer] = await ethers.getSigners();
  const packBattles = await ethers.getContractAt("PackBattles", "0x9b4568cE546c1c54f15720783FE1744C20fF1914") as PackBattles;
  
  // // Check if there are enough unreserved NFTs
  // const unreservedNFTs = await packBattles.getUnreservedNFTCount();
  // if (unreservedNFTs < 2n) {
  //   console.error("Not enough unreserved NFTs available. Need at least 2 NFTs.");
  //   process.exit(1);
  // }

  // // Get the game fee
  const gameFee = await packBattles.GAME_FEE();
  
  try {
    // Create a game by sending the required fee
    const tx = await packBattles.createGame({ value: gameFee });
    const receipt = await tx.wait();
    
    if (receipt) {
      // Get the GameCreated event from the receipt
      const gameCreatedEvents = receipt.logs.filter(
        (log) => log.topics[0] === packBattles.interface.getEvent("GameCreated").topicHash
      );

      if (gameCreatedEvents.length > 0) {
        const event = gameCreatedEvents[0];
        const parsedLog = packBattles.interface.parseLog({
          topics: event.topics,
          data: event.data
        });
        
        if (parsedLog) {
          const [gameId, creator] = parsedLog.args;
          console.log(`Game created successfully!`);
          console.log(`Game ID: ${gameId}`);
          console.log(`Creator: ${creator}`);
        }
      }
    }
  } catch (error) {
    console.error("Error creating game:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 