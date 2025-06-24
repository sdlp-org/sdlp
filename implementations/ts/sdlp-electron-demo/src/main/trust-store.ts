import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';

export interface TrustedDID {
  addedAt: string;
  label?: string;
}

export interface TrustStoreData {
  [did: string]: TrustedDID;
}

export class TrustStore {
  private storePath: string;
  private data: TrustStoreData = {};

  constructor() {
    const userDataPath = app.getPath('userData');
    this.storePath = join(userDataPath, 'trust-store.json');
    this.loadData();
  }

  private loadData(): void {
    try {
      if (existsSync(this.storePath)) {
        const fileContent = readFileSync(this.storePath, 'utf-8');
        this.data = JSON.parse(fileContent);
      }
    } catch (error) {
      console.warn('Failed to load trust store data:', error);
      this.data = {};
    }
  }

  private saveData(): void {
    try {
      writeFileSync(this.storePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save trust store data:', error);
    }
  }

  isTrusted(did: string): boolean {
    return did in this.data;
  }

  addTrustedDID(did: string, label?: string): void {
    const trustedDID: TrustedDID = {
      addedAt: new Date().toISOString(),
    };

    if (label !== undefined) {
      trustedDID.label = label;
    }

    this.data[did] = trustedDID;
    this.saveData();
  }

  removeTrustedDID(did: string): boolean {
    if (did in this.data) {
      delete this.data[did];
      this.saveData();
      return true;
    }
    return false;
  }

  getTrustedDIDs(): TrustStoreData {
    return { ...this.data };
  }

  clear(): void {
    this.data = {};
    this.saveData();
  }
}
