import React from 'react';

interface SignFormProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const SignForm = ({ title, description, icon, children }: SignFormProps) => {
  return (
    <div className="w-full max-w-sm">
      <header className="flex flex-col items-center gap-2 mb-8 text-center">
        {icon && (
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">{icon}</div>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      </header>
      {children}
    </div>
  );
};

export default SignForm;
