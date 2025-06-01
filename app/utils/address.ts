/**
 * Shortens an Ethereum address to show first and last few characters
 * @param address - The full Ethereum address
 * @param startChars - Number of characters to show from start (default: 6)
 * @param endChars - Number of characters to show from end (default: 4)
 * @returns Shortened address like "0x1234...abcd"
 */
export function shortenAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Checks if an address is a valid Ethereum address
 * @param address - The address to validate
 * @returns True if valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
} 