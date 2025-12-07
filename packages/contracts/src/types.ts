export type SignatureProof = {
  sha256: string;
  signer: string;
  timestamp: string;
  ledgerUrl?: string;
  policyVerdict?: string;
};

export type KernelSignRequest = {
  sha256: string;
  metadata?: Record<string, unknown>;
};

export type KernelSignResponse = SignatureProof & {
  signature: string;
};

export type KernelVerifyRequest = {
  sha256: string;
  signature: string;
};

export type KernelVerifyResponse = SignatureProof & {
  valid: boolean;
};

export type MarketplaceListing = {
  sku: string;
  price: number;
  currency: string;
  sha256: string;
  status: "ready" | "canary" | "preview";
  signed: boolean;
};

export type StorySphereGenerateRequest = {
  prompt: string;
  duration: number;
  publishToLiveLoop?: boolean;
};

export type StorySphereGenerateResponse = {
  jobId: string;
  status: "queued" | "rendering" | "complete";
  previewEtaSeconds?: number;
  publishToLiveLoop?: boolean;
};

export type LiveLoopPublishRequest = {
  assetId: string;
  schedule?: string;
};

export type LiveLoopPublishResponse = {
  assetId: string;
  scheduledFor: string;
  status: string;
  proof: SignatureProof;
};
