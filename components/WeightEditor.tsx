'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TierConfig } from '@/lib/types';

interface SortableItemProps {
  tier: TierConfig;
  rank: number;
}

function SortableItem({ tier, rank }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tier.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        isDragging
          ? 'border-white/40 bg-white/15 shadow-xl z-10 relative'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
      }`}
    >
      {/* Rank badge */}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60">
        {rank}
      </span>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{tier.label}</p>
        <p className="text-xs text-white/40 mt-0.5 truncate">{tier.description}</p>
      </div>

      {/* Drag handle */}
      <button
        className={`shrink-0 cursor-grab active:cursor-grabbing p-1 rounded text-white/30 hover:text-white/60 transition-colors touch-none ${isDragging ? 'text-white/60' : ''}`}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5.5" cy="4" r="1.2" />
          <circle cx="10.5" cy="4" r="1.2" />
          <circle cx="5.5" cy="8" r="1.2" />
          <circle cx="10.5" cy="8" r="1.2" />
          <circle cx="5.5" cy="12" r="1.2" />
          <circle cx="10.5" cy="12" r="1.2" />
        </svg>
      </button>
    </div>
  );
}

interface Props {
  tiers: TierConfig[];
  onChange: (tiers: TierConfig[]) => void;
}

export default function WeightEditor({ tiers, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tiers.findIndex((t) => t.id === active.id);
      const newIndex = tiers.findIndex((t) => t.id === over.id);
      onChange(arrayMove(tiers, oldIndex, newIndex));
    }
  }

  return (
    <div className="w-full max-w-md">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/30">
        Priority Order
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tiers.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {tiers.map((tier, i) => (
              <SortableItem key={tier.id} tier={tier} rank={i + 1} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
