import { env } from "process";

export function approvalRequired() {
  return env.AGENT_APPROVAL_REQUIRED !== "false";
}

export function getApproverList() {
  return (env.AGENT_APPROVER ?? "Ryan Lueckenotte")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

export function isValidApprover(name: string) {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return false;
  const approvers = getApproverList().map((approver) => approver.toLowerCase());
  return approvers.includes(normalized);
}
