'use client';

import Link from 'next/link';
import { BuildingIcon, PlayIcon } from '@/components/icons';

// Placeholder project data for MVP
const demoProjects = [
  {
    id: '1',
    name: 'Sample House A',
    address: 'Tokyo, Minato-ku',
    status: 'in-progress',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
  },
  {
    id: '2',
    name: 'Sample House B',
    address: 'Osaka, Chuo-ku',
    status: 'completed',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
  },
  {
    id: '3',
    name: 'Sample House C',
    address: 'Nagoya, Naka-ku',
    status: 'draft',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-08',
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: 'bg-zinc-700 text-zinc-300',
    'in-progress': 'bg-amber-500/20 text-amber-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
  };

  const labels = {
    draft: 'Draft',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              S
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">Scaff-Pro</h1>
              <p className="text-xs text-zinc-500">Scaffold Planning System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">Demo User</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-300">
              D
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-100">Projects</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Manage your scaffold planning projects
            </p>
          </div>

          <Link
            href="/planning"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/40"
          >
            <PlayIcon size={16} />
            New Project
          </Link>
        </div>

        {/* Project list */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 border-b border-zinc-800 bg-zinc-800/30 px-6 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
            <div className="col-span-4">Project Name</div>
            <div className="col-span-3">Address</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Updated</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table body */}
          <div className="divide-y divide-zinc-800/50">
            {demoProjects.map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-800/30"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                    <BuildingIcon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-100">{project.name}</p>
                    <p className="text-xs text-zinc-500">Created {project.createdAt}</p>
                  </div>
                </div>

                <div className="col-span-3 text-sm text-zinc-400">{project.address}</div>

                <div className="col-span-2">
                  <StatusBadge status={project.status} />
                </div>

                <div className="col-span-2 text-sm text-zinc-500">{project.updatedAt}</div>

                <div className="col-span-1 flex justify-end">
                  <Link
                    href="/planning"
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty state hint */}
        <div className="mt-8 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
            <BuildingIcon size={24} className="text-blue-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-zinc-200">Getting Started</h3>
          <p className="mx-auto max-w-md text-sm text-zinc-500">
            Click "New Project" to create a scaffold plan. Upload building drawings, set conditions,
            and let AI help you with automatic scaffold layout calculation.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800 bg-zinc-900/30 py-6">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-zinc-600">
          <p>Scaff-Pro MVP v0.1.0 — Revolutionizing the construction industry</p>
        </div>
      </footer>
    </div>
  );
}
