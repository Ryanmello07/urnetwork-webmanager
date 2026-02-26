import { useCallback } from "react";
import type { WalletAuthPayload } from "../services/types";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(bytes: Uint8Array): string {
  let num = BigInt(0);
  for (const byte of bytes) {
    num = num * BigInt(256) + BigInt(byte);
  }

  let encoded = "";
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(58));
    num = num / BigInt(58);
    encoded = BASE58_ALPHABET[remainder] + encoded;
  }

  for (const byte of bytes) {
    if (byte === 0) encoded = "1" + encoded;
    else break;
  }

  return encoded;
}

const SIGN_MESSAGE = "Sign in to URnetwork";

export type SolanaWalletType = "phantom" | "solflare";

interface UseWalletLoginResult {
  connectAndSign: (
    walletType: SolanaWalletType
  ) => Promise<WalletAuthPayload | null>;
  isPhantomAvailable: boolean;
  isSolflareAvailable: boolean;
}

export function useWalletLogin(): UseWalletLoginResult {
  const isPhantomAvailable =
    typeof window !== "undefined" && !!window.solana?.isPhantom;
  const isSolflareAvailable =
    typeof window !== "undefined" && !!window.solflare?.isSolflare;

  const connectAndSign = useCallback(
    async (walletType: SolanaWalletType): Promise<WalletAuthPayload | null> => {
      const provider =
        walletType === "phantom" ? window.solana : window.solflare;

      if (!provider) {
        throw new Error(
          walletType === "phantom"
            ? "Phantom wallet not found. Please install the Phantom browser extension."
            : "Solflare wallet not found. Please install the Solflare browser extension."
        );
      }

      await provider.connect();

      if (!provider.publicKey) {
        throw new Error("Failed to connect wallet. No public key found.");
      }

      const walletAddress = provider.publicKey.toString();
      const walletMessage = SIGN_MESSAGE;
      const messageBytes = new TextEncoder().encode(walletMessage);

      const result = await provider.signMessage(messageBytes, "utf8");
      const walletSignature = encodeBase58(result.signature);

      return {
        wallet_address: walletAddress,
        wallet_message: walletMessage,
        wallet_signature: walletSignature,
        blockchain: "solana",
      };
    },
    []
  );

  return { connectAndSign, isPhantomAvailable, isSolflareAvailable };
}
