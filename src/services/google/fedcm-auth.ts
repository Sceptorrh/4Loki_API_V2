import { googleConfig } from './config';
import crypto from 'crypto';

// Add type declarations for browser APIs
declare global {
  var window: {
    location: {
      hostname: string;
    };
  };
  var navigator: {
    credentials: {
      get(options: any): Promise<any>;
    };
  };
}

interface FedCMCredential {
  id: string;
  type: string;
  token: string;
  select_account: boolean;
}

interface FedCMResponse {
  id: string;
  type: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
    userHandle: string;
  };
}

export class FedCMAuthService {
  private static instance: FedCMAuthService;
  private nonce: string | undefined;

  private constructor() {}

  public static getInstance(): FedCMAuthService {
    if (!FedCMAuthService.instance) {
      FedCMAuthService.instance = new FedCMAuthService();
    }
    return FedCMAuthService.instance;
  }

  private generateNonce(): string {
    this.nonce = crypto.randomBytes(32).toString('hex');
    return this.nonce;
  }

  private async validateNonce(response: FedCMResponse): Promise<boolean> {
    if (!this.nonce) return false;
    
    try {
      const clientData = JSON.parse(
        Buffer.from(response.response.clientDataJSON, 'base64').toString()
      );
      return clientData.nonce === this.nonce;
    } catch (error) {
      console.error('Error validating nonce:', error);
      return false;
    }
  }

  public async signIn(): Promise<FedCMCredential | null> {
    try {
      // Generate a new nonce for this sign-in attempt
      const nonce = this.generateNonce();

      // Create the FedCM credential request
      const credentialRequestOptions = {
        publicKey: {
          challenge: Buffer.from(nonce),
          rp: {
            id: window.location.hostname,
            name: '4Loki API'
          },
          allowCredentials: [{
            type: 'public-key',
            id: Uint8Array.from(googleConfig.fedcm.clientId, c => c.charCodeAt(0))
          }],
          userVerification: 'preferred'
        }
      };

      // Request the credential
      const credential = await navigator.credentials.get(credentialRequestOptions) as FedCMResponse;
      
      if (!credential) {
        throw new Error('No credential received');
      }

      // Validate the nonce
      const isValidNonce = await this.validateNonce(credential);
      if (!isValidNonce) {
        throw new Error('Invalid nonce');
      }

      // Return the credential in the expected format
      return {
        id: credential.id,
        type: credential.type,
        token: credential.response.attestationObject,
        select_account: googleConfig.fedcm.select_account
      };
    } catch (error) {
      console.error('FedCM sign-in error:', error);
      return null;
    }
  }

  public async signOut(): Promise<void> {
    // Clear any stored credentials or state
    this.nonce = undefined;
  }
} 