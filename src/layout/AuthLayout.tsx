import { Link, Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <header className="flex justify-center pt-10 pb-2">
        <Link to="/sign-in" className="flex items-center gap-2 select-none">
          <span className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">N</span>
          </span>
          <span className="text-xl font-bold text-foreground tracking-tight">Nicoflow</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
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
  );
};

export default AuthLayout;
