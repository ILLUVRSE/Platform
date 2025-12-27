import { prisma } from "@illuvrse/db";
import { Card, PageSection, StatBadge } from "@illuvrse/ui";
import { buildMetadata, buildJsonLd } from "@/lib/metadata";

const title = "Task graph | Control-Panel";
const description =
  "Parent/child delegation view from AgentManager with recent task status.";

export const metadata = buildMetadata({
  title,
  description,
  path: "/control-panel/tasks",
  noIndex: true
});

const pageJsonLd = buildJsonLd({
  title,
  description,
  path: "/control-panel/tasks",
  type: "WebPage"
});

export default async function ControlPanelTasksPage() {
  const tasks = await prisma.agentTask.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  const byParent = new Map<string, typeof tasks>();
  for (const task of tasks) {
    const key = task.parentId ?? "root";
    const list = byParent.get(key) ?? [];
    list.push(task);
    byParent.set(key, list);
  }

  const roots = byParent.get("root") ?? [];

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(pageJsonLd)}</script>
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
          <h1 className="text-3xl font-semibold">Agent Task Graph</h1>
          <p className="mt-2 text-sm text-slate-600">Parent/child delegation view from AgentManager.</p>
        </section>

        <PageSection eyebrow="Tasks" title="Recent delegation">
          <div className="grid gap-4">
            {roots.length ? (
              roots.map((task) => {
                const children = byParent.get(task.id) ?? [];
                return (
                  <Card
                    key={task.id}
                    title={task.title}
                    body={
                      <div className="space-y-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatBadge label="Status" value={task.status} variant={task.status === "completed" ? "success" : "neutral"} />
                          <span className="text-xs text-slate-500">Agent: {task.agentId}</span>
                          <span className="text-xs text-slate-400">{new Date(task.createdAt).toLocaleString()}</span>
                        </div>
                        {children.length ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Children</div>
                            <div className="mt-2 space-y-2">
                              {children.map((child) => (
                                <div key={child.id} className="flex items-center justify-between text-xs text-slate-700">
                                  <span>{child.title}</span>
                                  <span className="text-slate-400">{child.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">No child tasks yet.</div>
                        )}
                      </div>
                    }
                  />
                );
              })
            ) : (
              <Card title="No tasks yet" body={<p className="text-sm text-slate-600">Trigger an agent task to see the graph here.</p>} />
            )}
          </div>
        </PageSection>
      </div>
    </>
  );
}
