import * as React from 'react';
import { createPortal } from 'react-dom';

import { AnimatePresence, motion } from 'framer-motion';

type LoadingOverlayOptions = {
  title?: string;
  subtitle?: string;
};

type LoadingOverlayContextValue = {
  show: (options?: LoadingOverlayOptions) => void;
  hide: () => void;
};

const LoadingOverlayContext = React.createContext<LoadingOverlayContextValue | null>(null);

export const useLoadingOverlay = (): LoadingOverlayContextValue => {
  const ctx = React.useContext(LoadingOverlayContext);
  if (!ctx) throw new Error('useLoadingOverlay must be used within LoadingOverlayProvider');
  return ctx;
};

export const LoadingOverlayProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [title, setTitle] = React.useState<string>('Working on it...');
  const [subtitle, setSubtitle] = React.useState<string>('Please wait');

  const show = React.useCallback((options?: LoadingOverlayOptions) => {
    if (options?.title) setTitle(options.title);
    if (options?.subtitle) setSubtitle(options.subtitle);
    setIsOpen(true);
  }, []);

  const hide = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = React.useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <LoadingOverlayContext.Provider value={value}>
      {children}
      {createPortal(<Overlay isOpen={isOpen} title={title} subtitle={subtitle} />, document.body)}
    </LoadingOverlayContext.Provider>
  );
};

function Overlay({ isOpen, title, subtitle }: { isOpen: boolean; title: string; subtitle?: string }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1000] bg-[rgba(10,10,15,0.6)] backdrop-blur-sm"
        >
          {/* Ember aurora blobs */}
          <Aurora />

          {/* Dropdown panel */}
          <motion.div
            key="panel"
            initial={{ y: '-100%', opacity: 0.6, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
            className="mx-auto mt-8 w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-2xl ring-1 ring-white/10"
          >
            <div className="flex items-center gap-4">
              <Spinner />
              <div className="min-w-0">
                <div className="text-base font-semibold tracking-tight text-white drop-shadow-sm">{title}</div>
                {subtitle ? <div className="text-sm text-white/70">{subtitle}</div> : null}
              </div>
            </div>

            {/* Animated ember shimmer bar */}
            <div className="relative mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.span
                className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary/60"
                initial={{ x: '-100%' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
              />
            </div>

            {/* Subtle ember bottom glow */}
            <div className="pointer-events-none absolute -inset-x-10 -bottom-8 h-24 bg-gradient-to-t from-primary/20 via-primary/10 to-transparent blur-2xl" />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Spinner() {
  return (
    <motion.div
      className="relative grid h-12 w-12 place-items-center"
      initial={false}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
    >
      <div className="absolute inset-0 rounded-full border-2 border-white/20" />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-t-transparent border-l-transparent border-white"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
      />
      <motion.div
        className="absolute h-2 w-2 rounded-full bg-white"
        animate={{ y: [10, -10, 10] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

function Aurora() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-32 left-1/2 h-64 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/30 via-primary/20 to-transparent blur-3xl"
        animate={{ y: [0, 10, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 left-1/3 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl"
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-10 right-1/4 h-52 w-52 translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        animate={{ x: [0, -25, 10, 0], y: [0, 15, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
