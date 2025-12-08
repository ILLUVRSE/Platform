export type AvatarRenderInput = {
  avatarId?: string;
  assets?: string[];
  phonemes?: { time: number; value: string }[];
  voiceUrl?: string;
};

export type AvatarRenderOutput = {
  framesUrl: string;
  previewUrl: string;
  meta: Record<string, unknown>;
};

export interface AvatarController {
  render(input: AvatarRenderInput): Promise<AvatarRenderOutput>;
}

export class MockAvatarController implements AvatarController {
  async render(input: AvatarRenderInput): Promise<AvatarRenderOutput> {
    const id = input.avatarId ?? "avatar-mock";
    return {
      framesUrl: `s3://avatars/${id}/frames/preview`,
      previewUrl: `s3://avatars/${id}/preview.mp4`,
      meta: { phonemes: input.phonemes?.length ?? 0, source: "mock" }
    };
  }
}
