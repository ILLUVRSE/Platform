import { NextResponse } from "next/server";
import { store } from "@studio/lib/store";
import { defaultStudioProject, type StudioProject } from "@studio/lib/studioProject";
import { defaultEpisodePlan, type EpisodePlan } from "@studio/lib/episodePlan";

const normalizeProject = (project: Partial<StudioProject> | null): StudioProject => {
  if (!project) return defaultStudioProject;
  return {
    title: project.title ?? defaultStudioProject.title,
    prompt: project.prompt ?? defaultStudioProject.prompt,
    tracks: project.tracks ?? defaultStudioProject.tracks
  };
};

const normalizeEpisodePlan = (plan: Partial<EpisodePlan> | null): EpisodePlan => {
  if (!plan) return defaultEpisodePlan;
  return {
    id: plan.id ?? defaultEpisodePlan.id,
    title: plan.title ?? defaultEpisodePlan.title,
    logline: plan.logline ?? defaultEpisodePlan.logline,
    style: plan.style ?? defaultEpisodePlan.style,
    runtimeTarget: plan.runtimeTarget ?? defaultEpisodePlan.runtimeTarget,
    scenes: plan.scenes ?? defaultEpisodePlan.scenes
  };
};

export async function GET() {
  const [project, episode] = await Promise.all([store.getStudioProject(), store.getEpisodePlan()]);
  return NextResponse.json({ project, episode });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const hasProject = Object.prototype.hasOwnProperty.call(body, "project");
  const hasEpisode = Object.prototype.hasOwnProperty.call(body, "episode");
  const incomingProject = (hasProject ? body.project : !hasEpisode ? body : null) as
    | Partial<StudioProject>
    | null;
  const incomingEpisode = (hasEpisode ? body.episode : null) as Partial<EpisodePlan> | null;

  const project = incomingProject ? normalizeProject(incomingProject) : null;
  const episode = incomingEpisode ? normalizeEpisodePlan(incomingEpisode) : null;

  if (project) await store.setStudioProject(project);
  if (episode) await store.setEpisodePlan(episode);

  return NextResponse.json({
    project: project ?? (await store.getStudioProject()),
    episode: episode ?? (await store.getEpisodePlan())
  });
}
