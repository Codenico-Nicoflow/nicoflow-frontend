import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

function Collapsible({
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root> & { 'data-testid'?: string }) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" data-testid={testId || 'collapsible'} {...props} />;
}

function CollapsibleTrigger({
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger> & { 'data-testid'?: string }) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      data-testid={testId || 'collapsible-trigger'}
      {...props}
    />
  );
}

function CollapsibleContent({
  'data-testid': testId,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent> & { 'data-testid'?: string }) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      data-testid={testId || 'collapsible-content'}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
