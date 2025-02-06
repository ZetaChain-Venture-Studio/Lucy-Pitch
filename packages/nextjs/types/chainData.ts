import { Token } from "./token";

export interface ChainData {
  chainId: number;
  providerUrl?: string;
  aicAddress: string;
  name: string;
  moralisName?: string;
  tokens: Token[];
  usdcAddress: string;
}
