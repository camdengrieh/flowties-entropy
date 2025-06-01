import { ethers } from "hardhat";
import { PackOpening } from "../typechain-types";

async function main() {
  // Get the deployed contract address (you'll need to replace this with actual address)
  const [deployer] = await ethers.getSigners();
  const packOpening = await ethers.getContractAt("PackOpening", "REPLACE_WITH_DEPLOYED_ADDRESS") as PackOpening;
  


  try {
    // Add NFTs to the pack (only contract owner can do this)
    const tx = await packOpening.addNFTs(tokenIds);
    const receipt = await tx.wait();
    
    if (receipt) {
      console.log("✅ NFTs added successfully to the pack!");
      
      // Get updated pack info
      const availableNFTs = await packOpening.getAvailableNFTs();
      const count = await packOpening.getAvailableNFTCount();
      
      console.log(`Total NFTs now in pack: ${count}`);
      console.log(`Available Token IDs: ${availableNFTs.join(', ')}`);
    }
  } catch (error) {
    console.error("Error adding NFTs to pack:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 