import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ErrorPageIcon } from '@/assets/svgs';
import { Button } from '@/components/ui/button';

export default function ErrorPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="relative">
            <ErrorPageIcon />
            <motion.div
              className="absolute -top-2 -end-2 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <span className="text-primary text-xs font-bold">!</span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-4"
        >
          <h1 className="text-6xl md:text-8xl font-bold text-primary/20 select-none">{t('pages.error404.code')}</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('pages.error404.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">{t('pages.error404.body')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button asChild size="lg" className="min-w-[160px]">
            <Link to="/">
              <Home className="w-4 h-4 me-2" />
              {t('actions.goHome')}
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
