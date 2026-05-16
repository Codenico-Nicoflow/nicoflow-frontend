import { Link, Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left hero panel — hidden on mobile */}
      <div className="hidden lg:flex w-1/2 flex-col bg-primary text-primary-foreground p-10">
        <Link to="/sign-in" className="flex items-center gap-2 select-none">
          <span className="h-8 w-8 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">N</span>
          </span>
          <span className="text-xl font-bold tracking-tight">Nicoflow</span>
        </Link>

        <div className="flex flex-1 flex-col justify-center gap-4">
          <p className="text-4xl font-bold leading-tight tracking-tight">
            Your tasks,
            <br />
            organized.
          </p>
          <p className="text-primary-foreground/70 text-lg max-w-xs">
            Capture everything. Focus on what matters. Ship faster.
          </p>
        </div>

        <div className="flex gap-2">
          <span className="h-2 w-2 rounded-full bg-primary-foreground/40" />
          <span className="h-2 w-2 rounded-full bg-primary-foreground/25" />
          <span className="h-2 w-2 rounded-full bg-primary-foreground/15" />
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Mobile logo */}
        <header className="flex lg:hidden justify-center pt-8 pb-2">
          <Link to="/sign-in" className="flex items-center gap-2 select-none">
            <span className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">N</span>
            </span>
            <span className="text-xl font-bold text-foreground tracking-tight">Nicoflow</span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center p-8">
          <Outlet />
        </main>

        <footer className="flex justify-center gap-4 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Nicoflow</span>
          <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default AuthLayout;
