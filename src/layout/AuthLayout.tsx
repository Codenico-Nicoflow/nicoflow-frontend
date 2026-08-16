import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Link, Outlet } from 'react-router-dom';

import { Logo } from '@/components';

const SLIDES = [
  {
    headline: 'Your tasks,\norganized.',
    body: 'Capture everything. Focus on what matters. Ship faster.',
  },
  {
    headline: 'Projects &\nareas in sync.',
    body: 'Group your work into areas and projects that reflect how you actually think.',
  },
  {
    headline: 'Your inbox,\nzero friction.',
    body: "Drop anything into the Bucket. Process it when you're ready.",
  },
];

const AuthLayout = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 4000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="min-h-screen flex">
      {/* Left hero panel — hidden on mobile */}
      <div className="hidden lg:flex w-1/2 flex-col bg-primary text-primary-foreground p-10">
        <Link to="/sign-in" className="flex items-center gap-2 select-none">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white/15">
            <Logo variant="mark" size={24} mono className="text-white" />
          </span>
          <span className="text-xl font-bold tracking-tight">Nicoflow</span>
        </Link>

        <div className="flex flex-1 flex-col justify-center gap-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="flex flex-col gap-3"
            >
              <p className="text-4xl font-bold leading-tight tracking-tight whitespace-pre-line">{slide?.headline}</p>
              <p className="text-primary-foreground/70 text-lg max-w-xs">{slide?.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 bg-primary-foreground/80'
                  : 'w-2 bg-primary-foreground/30 hover:bg-primary-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Mobile logo */}
        <header className="flex lg:hidden justify-center pt-8 pb-2">
          <Link to="/sign-in" className="flex items-center gap-2 select-none">
            <Logo variant="mark" size={24} />
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
