export const Divider = ({
  'data-testid': testId,
  ...props
}: React.ComponentProps<'div'> & { 'data-testid'?: string }) => {
  return <div data-testid={testId || 'divider'} className="w-full h-px bg-gray-200" {...props} />;
};
