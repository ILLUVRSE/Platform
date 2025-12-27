// src/components/dashboard/GridManager.tsx
"use client";

import React, { useState } from "react";
import { Grid } from "@gridstock/types";
import { Button } from "@gridstock/components/ui/Button";
import { Input } from "@gridstock/components/ui/Input";

interface GridManagerProps {
  grids: Grid[];
  activeGridId: string;
  onSelectGrid: (id: string) => void;
  onCreateGrid: (name: string) => void;
  onDeleteGrid: (id: string) => void;
  onReorderGrids: (fromId: string, toId: string) => void;
  onUpdateGrid: (grid: Grid) => void;
  dragGridId: string | null;
  setDragGridId: (id: string | null) => void;
}

export const GridManager: React.FC<GridManagerProps> = ({
  grids,
  activeGridId,
  onSelectGrid,
  onCreateGrid,
  onDeleteGrid,
  onReorderGrids,
  onUpdateGrid,
  dragGridId,
  setDragGridId,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newGridName, setNewGridName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const activeGrid = grids.find((g) => g.id === activeGridId);

  const handleCreate = () => {
    if (newGridName.trim()) {
      onCreateGrid(newGridName);
      setNewGridName("");
      setIsCreating(false);
    }
  };

  const handleRename = () => {
    if (!activeGrid || !renameValue.trim()) return;
    onUpdateGrid({ ...activeGrid, name: renameValue.trim() });
    setIsRenaming(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {grids.map((grid) => (
          <button
            key={grid.id}
            draggable
            onDragStart={() => setDragGridId(grid.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragGridId && dragGridId !== grid.id) {
                onReorderGrids(dragGridId, grid.id);
              }
              setDragGridId(null);
            }}
            onClick={() => onSelectGrid(grid.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
              activeGridId === grid.id
                ? "bg-[rgb(var(--grid-accent))] text-slate-950 border-transparent shadow-[0_10px_24px_-18px_rgba(52,211,153,0.8)]"
                : "bg-[color:var(--grid-panel)] text-slate-200 border-[color:var(--grid-border)] hover:border-[rgb(var(--grid-accent)/0.4)]"
            }`}
          >
            <span>{grid.name}</span>
            {grid.pinned && (
              <span className="ml-2 text-[10px] tracking-wide uppercase text-amber-300">Pin</span>
            )}
          </button>
        ))}
        
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-[color:var(--grid-panel)] border border-dashed border-[color:var(--grid-border)] text-slate-400 hover:text-white hover:border-[rgb(var(--grid-accent)/0.4)] transition-colors"
          >
            + New Grid
          </button>
        )}
      </div>

      {isCreating && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
          <Input 
            placeholder="Grid Name" 
            value={newGridName} 
            onChange={(e) => setNewGridName(e.target.value)}
            className="w-40"
            autoFocus
          />
          <Button size="sm" onClick={handleCreate}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
        </div>
      )}
      
      {grids.length > 0 && activeGridId && (
        <div className="sm:ml-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Poll</span>
            <select
              className="gs-select text-xs px-2 py-1 rounded-full"
              value={activeGrid?.pollIntervalMs ?? 4000}
              onChange={(e) => {
                if (!activeGrid) return;
                onUpdateGrid({ ...activeGrid, pollIntervalMs: Number(e.target.value) });
              }}
            >
              <option value={2000}>2s</option>
              <option value={4000}>4s</option>
              <option value={8000}>8s</option>
              <option value={12000}>12s</option>
            </select>
          </div>
          {activeGrid && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={activeGrid.pinned ? "primary" : "secondary"}
                onClick={() =>
                  onUpdateGrid({ ...activeGrid, pinned: !activeGrid.pinned })
                }
              >
                {activeGrid.pinned ? "Pinned" : "Pin"}
              </Button>
              {!isRenaming ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setRenameValue(activeGrid.name);
                    setIsRenaming(true);
                  }}
                >
                  Rename
                </Button>
              ) : (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                  <Input
                    placeholder="Grid Name"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="w-40"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleRename}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsRenaming(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this grid?")) {
                    onDeleteGrid(activeGridId);
                  }
                }}
              >
                Delete Grid
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
