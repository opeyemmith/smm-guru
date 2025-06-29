/**
 * Utility to handle browser extension conflicts
 * This prevents wallet extensions from breaking the application
 */

export function handleExtensionConflicts() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Suppress ethereum property redefinition errors
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj: any, prop: string, descriptor: PropertyDescriptor) {
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      // Silently ignore ethereum property redefinition errors
      if (prop === 'ethereum' && error instanceof TypeError) {
        console.warn('Extension conflict detected: ethereum property already defined');
        return obj;
      }
      throw error;
    }
  };

  // Restore original defineProperty after a short delay
  setTimeout(() => {
    Object.defineProperty = originalDefineProperty;
  }, 1000);
}

/**
 * Check if wallet extensions are available
 */
export function detectWalletExtensions() {
  if (typeof window === 'undefined') return {};

  return {
    hasMetaMask: !!(window as any).ethereum?.isMetaMask,
    hasPhantom: !!(window as any).phantom?.solana,
    hasCoinbase: !!(window as any).ethereum?.isCoinbaseWallet,
    hasWalletConnect: !!(window as any).WalletConnect,
  };
}

/**
 * Safe way to access ethereum object
 */
export function getEthereumProvider() {
  if (typeof window === 'undefined') return null;
  
  try {
    return (window as any).ethereum || null;
  } catch (error) {
    console.warn('Could not access ethereum provider:', error);
    return null;
  }
}
