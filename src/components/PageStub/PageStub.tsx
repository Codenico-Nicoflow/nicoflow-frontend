import { Construction } from 'lucide-react';

interface PageStubProps {
  title: string;
}

const PageStub = ({ title }: PageStubProps) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
    <Construction className="h-10 w-10" />
    <p className="text-lg font-medium">{title}</p>
    <p className="text-sm">Coming soon</p>
  </div>
);

export default PageStub;
