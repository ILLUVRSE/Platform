#!/usr/bin/env node
import fs from "fs";
import crypto from "crypto";

function usage() {
  console.log("Usage: ace-sign <manifest.json>");
}

const file = process.argv[2];
if (!file) {
  usage();
  process.exit(1);
}

let raw;
try {
  raw = fs.readFileSync(file, "utf8");
} catch (err) {
  console.error("Failed to read file", err);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(raw);
} catch (err) {
  console.error("Invalid JSON", err);
  process.exit(1);
}

const { signing: _omit, ...payload } = manifest;
const sha = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
const signature = crypto.createHash("sha256").update(`${sha}:kernel-multisig`).digest("hex");

const proof = {
  sha256: sha,
  signer: "kernel-multisig",
  timestamp: new Date().toISOString(),
  signature
};

const signed = { ...manifest, signing: { proof } };
console.log(JSON.stringify(signed, null, 2));
