import { WaluConfig } from "./config";
import { IVersionFile } from "./types";
import { SHA256 } from "crypto-js";

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
  .replace(/-----BEGIN PUBLIC KEY-----/, '')
  .replace(/-----END PUBLIC KEY-----/, '')
  .replace(/\s/g, '');
  
  const binaryDerString = atob(b64);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  return binaryDer.buffer;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function checkIfValidSignature(cfg: WaluConfig, version: IVersionFile): Promise<void> {
  try {
    const publicKeyBuffer = pemToArrayBuffer(cfg.getPublicKey());
    const publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      true,
      ["verify"]
    );

    const signatureBuffer = base64ToArrayBuffer(version.signature);
    const calculatedHash = SHA256(version.hash + version.version).toString();
    const dataBuffer = new TextEncoder().encode(calculatedHash);
    const isValid = await crypto.subtle.verify(
      {
        name: "RSASSA-PKCS1-v1_5",
      },
      publicKey,
      signatureBuffer,
      dataBuffer
    );

    if (!isValid) throw new Error("Signature verification failed: The signature does not match the data.");
  } catch (error) {
    console.error("An error occurred during signature verification:", error);
    throw new Error(`Signature verification failed. ${error instanceof Error ? error.message : String(error)}`);
  }
}
