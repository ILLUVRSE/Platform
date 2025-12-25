"use client";

import { useEffect } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { rememberManifest } from "./recent";

type Props = {
  manifest: AceAgentManifest | null;
};

export function HandoffSync({ manifest }: Props) {
  useEffect(() => {
    if (!manifest) return;
    try {
      const json = JSON.stringify(manifest, null, 2);
      const existing = localStorage.getItem("ace-playground-manifest");
      if (existing === json) return;
      localStorage.setItem("ace-playground-manifest", json);
      rememberManifest(manifest);
      document.cookie = `ace-playground-manifest=${encodeURIComponent(json)}; path=/; max-age=900`;
    } catch {
      // ignore storage errors
    }
  }, [manifest]);

  return null;
}
