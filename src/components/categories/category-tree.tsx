"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  ChevronDown,
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Folder,
  FolderOpen,
  HelpCircle,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { S3_HOST } from "@/lib/config";

// Helper to render Lucide icon by name
function DynamicIcon({ name, className }: { name: string | null; className?: string }) {
  if (!name) return <HelpCircle className={className} />;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return <HelpCircle className={className} />;

  return <Icon className={className} />;
}

export type CategoryTreeNode = {
  id: string;
  reference: string;
  designation: string | null;
  slug: string | null;
  logo: string | null;
  image: string | null;
  isSubCategory: boolean | null;
  sortIndex: number | null;
  globalCategoryId: string | null;
  globalCategory: {
    id: string;
    name: string;
    nameFr: string | null;
    slug: string;
    iconName: string | null;
  } | null;
  children: CategoryTreeNode[];
};

interface CategoryTreeProps {
  categories: CategoryTreeNode[];
  onEdit: (category: CategoryTreeNode) => void;
  onDelete: (category: CategoryTreeNode) => void;
  onAddChild: (parentId: string) => void;
  onReorder: (updates: Array<{ id: string; sortIndex: number; idParent: string | null }>) => void;
}

interface SortableItemProps {
  category: CategoryTreeNode;
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: () => void;
}

function SortableItem({
  category,
  depth,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = category.children.length > 0;
  const displayName = category.designation || category.reference;

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg border bg-card transition-colors",
          "hover:bg-accent/50",
          isDragging && "shadow-lg ring-2 ring-primary/50"
        )}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Expand/Collapse */}
        <button
          onClick={onToggle}
          className={cn(
            "p-0.5 rounded transition-colors",
            hasChildren ? "hover:bg-accent" : "invisible"
          )}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Icon / Logo */}
        <div className="flex-shrink-0">
          {category.logo ? (
            <img
              src={`${S3_HOST}/${category.logo}`}
              alt={displayName}
              className="h-6 w-6 rounded object-cover"
            />
          ) : hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-primary" />
            ) : (
              <Folder className="h-4 w-4 text-primary" />
            )
          ) : (
            <div className="h-4 w-4 rounded bg-muted" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{displayName}</span>
            {category.globalCategory && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground truncate max-w-[120px] flex items-center gap-1">
                <DynamicIcon name={category.globalCategory.iconName} className="h-3 w-3" />
                {category.globalCategory.nameFr || category.globalCategory.name}
              </span>
            )}
          </div>
          {category.reference !== displayName && (
            <span className="text-xs text-muted-foreground">{category.reference}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onAddChild}
            title="Ajouter une sous-catégorie"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onEdit}
            title="Modifier"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface TreeItemProps {
  category: CategoryTreeNode;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (category: CategoryTreeNode) => void;
  onDelete: (category: CategoryTreeNode) => void;
  onAddChild: (parentId: string) => void;
}

function TreeItem({
  category,
  depth,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: TreeItemProps) {
  const isExpanded = expandedIds.has(category.id);

  return (
    <div className="space-y-1">
      <SortableItem
        category={category}
        depth={depth}
        isExpanded={isExpanded}
        onToggle={() => onToggle(category.id)}
        onEdit={() => onEdit(category)}
        onDelete={() => onDelete(category)}
        onAddChild={() => onAddChild(category.id)}
      />
      {isExpanded && category.children.length > 0 && (
        <div className="space-y-1">
          <SortableContext
            items={category.children.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {category.children.map((child) => (
              <TreeItem
                key={child.id}
                category={child}
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

export function CategoryTree({
  categories,
  onEdit,
  onDelete,
  onAddChild,
  onReorder,
}: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Flatten tree to find positions
    const flattenTree = (
      nodes: CategoryTreeNode[],
      parentId: string | null = null
    ): Array<{ id: string; sortIndex: number; idParent: string | null }> => {
      return nodes.flatMap((node, index) => [
        { id: node.id, sortIndex: index, idParent: parentId },
        ...flattenTree(node.children, node.id),
      ]);
    };

    const flatList = flattenTree(categories);
    const activeIndex = flatList.findIndex((item) => item.id === active.id);
    const overIndex = flatList.findIndex((item) => item.id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    // Simple reorder: just swap sort indices at the same level
    // For a more sophisticated implementation, you'd detect the drop target's parent
    const activeItem = flatList[activeIndex];
    const overItem = flatList[overIndex];

    if (activeItem.idParent === overItem.idParent) {
      // Same level reorder
      const updates = flatList.map((item, index) => {
        if (item.idParent !== activeItem.idParent) return null;

        let newSortIndex = item.sortIndex;
        if (item.id === active.id) {
          newSortIndex = overItem.sortIndex;
        } else if (item.id === over.id) {
          newSortIndex = activeItem.sortIndex;
        }
        return { id: item.id, sortIndex: newSortIndex, idParent: item.idParent };
      }).filter(Boolean) as Array<{ id: string; sortIndex: number; idParent: string | null }>;

      onReorder(updates);
    }
  };

  // Find active category for overlay
  const findCategory = (id: string, nodes: CategoryTreeNode[]): CategoryTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findCategory(id, node.children);
      if (found) return found;
    }
    return null;
  };

  const activeCategory = activeId ? findCategory(activeId, categories) : null;

  // Get all IDs for sortable context
  const getAllIds = (nodes: CategoryTreeNode[]): string[] => {
    return nodes.flatMap((node) => [node.id, ...getAllIds(node.children)]);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={getAllIds(categories)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {categories.map((category) => (
            <TreeItem
              key={category.id}
              category={category}
              depth={0}
              expandedIds={expandedIds}
              onToggle={handleToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeCategory && (
          <div className="flex items-center gap-2 py-2 px-3 rounded-lg border bg-card shadow-lg">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {activeCategory.designation || activeCategory.reference}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
