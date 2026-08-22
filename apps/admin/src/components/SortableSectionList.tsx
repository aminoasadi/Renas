"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SectionEditorForm } from "./section-editors/SectionEditorForm";
import type { AdminPageSection } from "@/lib/types";

interface Props {
  sections: AdminPageSection[];
  onReorder: (orderedIds: string[]) => void;
  onUpdateContent: (sectionId: string, content: unknown) => void;
  onToggleVisible: (sectionId: string, isVisible: boolean) => void;
  onDuplicate: (sectionId: string) => void;
  onRemove: (sectionId: string) => void;
}

export function SortableSectionList({ sections, onReorder, onUpdateContent, onToggleVisible, onDuplicate, onRemove }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    onReorder(arrayMove(sections, oldIndex, newIndex).map((s) => s.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="editor-sections">
          {sections.map((section) => (
            <SortableSectionCard
              key={section.id}
              section={section}
              onUpdateContent={(content) => onUpdateContent(section.id, content)}
              onToggleVisible={() => onToggleVisible(section.id, !section.isVisible)}
              onDuplicate={() => onDuplicate(section.id)}
              onRemove={() => onRemove(section.id)}
            />
          ))}
          {sections.length === 0 && <p className="meta">No sections yet — add one below.</p>}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableSectionCard({
  section,
  onUpdateContent,
  onToggleVisible,
  onDuplicate,
  onRemove,
}: {
  section: AdminPageSection;
  onUpdateContent: (content: unknown) => void;
  onToggleVisible: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="editor-section-card">
      <div className="editor-section-card__header">
        <span {...attributes} {...listeners} style={{ cursor: "grab" }}>
          ⠿
        </span>
        <span className="editor-section-card__type">
          {section.type.replace(/_/g, " ").toUpperCase()} {!section.isVisible && "(hidden)"}
        </span>
        <button type="button" className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Collapse" : "Edit"}
        </button>
        <button type="button" className="admin-btn admin-btn--sm admin-btn--ghost" onClick={onToggleVisible}>
          {section.isVisible ? "Hide" : "Show"}
        </button>
        <button type="button" className="admin-btn admin-btn--sm admin-btn--ghost" onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={onRemove}>
          Delete
        </button>
      </div>
      {expanded && (
        <div className="editor-section-card__body">
          <SectionEditorForm type={section.type} content={section.content as Record<string, unknown>} onChange={onUpdateContent} />
        </div>
      )}
    </div>
  );
}
