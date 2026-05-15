import React from 'react';

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

interface SignFormProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const SignForm = ({ title, description, icon, children }: SignFormProps) => {
  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="flex flex-col items-center gap-1 pb-4">
        {icon && <div className="mb-1">{icon}</div>}
        <h1 className="text-2xl font-semibold tracking-tight leading-none">{title}</h1>
        <CardDescription className="text-sm text-muted-foreground text-center max-w-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default SignForm;
