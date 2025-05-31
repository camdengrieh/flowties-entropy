// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
 
contract CoinFlip is IEntropyConsumer {
  event FlipRequested(uint64 sequenceNumber);
  event FlipResult(uint64 sequenceNumber, bool isHeads);
 
  IEntropy entropy;
  address provider;
 
  constructor(address _entropy, address _provider) {
    entropy = IEntropy(_entropy);
    provider = _provider;
  }
 
  // This method is required by the IEntropyConsumer interface
  function getEntropy() internal view override returns (address) {
    return address(entropy);
  }

  function request(bytes32 userRandomNumber) external payable {
    // get the required fee
    uint128 requestFee = entropy.getFee(provider);
    // check if the user has sent enough fees
    if (msg.value < requestFee) revert("not enough fees");
 
    // pay the fees and request a random number from entropy
    uint64 sequenceNumber = entropy.requestWithCallback{ value: requestFee }(
      provider,
      userRandomNumber
    );
 
    // emit event
    emit FlipRequested(sequenceNumber);
  }

  function entropyCallback(
    uint64 sequenceNumber,
    // If your app uses multiple providers, you can use this argument
    // to distinguish which one is calling the app back. This app only
    // uses one provider so this argument is not used.
    address _providerAddress,
    bytes32 randomNumber
  ) internal override {
    bool isHeads = uint256(randomNumber) % 2 == 0;
 
    emit FlipResult(sequenceNumber, isHeads);
  }
}
 