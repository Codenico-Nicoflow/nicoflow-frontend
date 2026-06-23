import { motion } from 'framer-motion';
import { Archive, CheckCircle, Clock } from 'lucide-react';
import { type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { PROJECT_STATUS } from '@/lib/types';
import { type ProjectFormData } from '@/lib/utils';

interface ProjectStatusFieldProps {
  control: Control<ProjectFormData>;
}

export const ProjectStatusField = ({ control }: ProjectStatusFieldProps) => {
  const { t } = useTranslation('project');

  const statusOptions = [
    { value: PROJECT_STATUS.ACTIVE, label: t('status.active'), icon: Clock },
    { value: PROJECT_STATUS.COMPLETED, label: t('status.completed'), icon: CheckCircle },
    { value: PROJECT_STATUS.ARCHIVED, label: t('status.archived'), icon: Archive },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t('statusField.label')}
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors">
                  <SelectValue placeholder={t('statusField.placeholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {statusOptions.map(option => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
};
