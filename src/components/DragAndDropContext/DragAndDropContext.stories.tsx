import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Meta, StoryObj } from '@storybook/react';
import { Folder } from 'lucide-react';
import { expect, within } from 'storybook/test';

import { mockProject } from '@/stories/mocks';

import { DragAndDropContext } from '.';

const meta: Meta<typeof DragAndDropContext> = {
  title: 'Components/DragAndDropContext',
  component: DragAndDropContext,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof DragAndDropContext>;

const project = mockProject({ id: 'project-1', name: 'Website Redesign', areaId: 'area-1' });

const DraggableProject = () => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `project-${project.id}`,
    data: { project },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      className={`flex items-center gap-2 p-2 rounded-md border bg-card cursor-grab select-none ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <Folder className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-foreground">{project.name}</span>
    </div>
  );
};

const DroppableArea = ({ id, label, withProject }: { id: string; label: string; withProject?: boolean }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`w-48 min-h-24 rounded-lg border-2 border-dashed p-3 space-y-2 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {withProject && <DraggableProject />}
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <DragAndDropContext>
      <div className="flex gap-6 p-4">
        <DroppableArea id="area-1" label="Work" withProject />
        <DroppableArea id="area-2" label="Personal" />
      </div>
    </DragAndDropContext>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Website Redesign')).toBeInTheDocument();
    await expect(canvas.getByText('Work')).toBeInTheDocument();
    await expect(canvas.getByText('Personal')).toBeInTheDocument();
  },
};
