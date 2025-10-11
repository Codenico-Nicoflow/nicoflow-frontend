// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, FolderOpen, Loader2, Sparkles,Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import {
  type IconId,
  type ProjectFormData,
  projectSchema,
  showErrorToast,
  showSuccessToast,
  useCreateProjectMutation,
  useGetCategoriesQuery,
} from '@my-monorepo/store';
import { categoryApi, ToastMessages } from '@my-monorepo/store';

import IconPicker from '@/components/sidebar/categories/new-project/IconPicker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Project {
  id: number;
  name: string;
  icon: string;
  isFavorite: boolean;
  dueDate?: Date;
  status: 'active' | 'archived' | 'completed';
  categoryId?: number;
}

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project; // If provided, it's edit mode
  onSuccess?: () => void;
}

const ProjectDialog = ({ open, onOpenChange, project, onSuccess }: ProjectDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!project;

  const [createProject] = useCreateProjectMutation();
  const { data: categories, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const dispatch = useDispatch();

  const form = useForm<ProjectFormData>({
    defaultValues: {
      name: project?.name || '',
      categoryId: project?.categoryId || categories?.[0]?.id || 1,
      icon: (project?.icon as IconId) || 'folder',
      dueDate: project?.dueDate ? new Date(project.dueDate) : undefined,
      isFavorite: project?.isFavorite || false,
    },
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        // TODO: Implement API call to update project
        console.log('Updating project:', data);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        showSuccessToast('Project updated successfully');
      } else {
        await createProject(data).unwrap();
        dispatch(categoryApi.util.invalidateTags(['Category']));
        showSuccessToast(ToastMessages.PROJECT_CREATED);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl sm:rounded-lg rounded-none">
        <DialogTitle className="sr-only">{isEditMode ? 'Edit Project' : 'Create New Project'}</DialogTitle>

        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative cursor-default"
          >
            <div className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 dark:from-primary/10 dark:via-secondary/10 dark:to-accent/10 p-4 sm:p-6 lg:p-8 rounded-t-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-lg" />

              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
                >
                  <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                    <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      {isEditMode ? 'Edit Project' : 'Create New Project'}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                      {isEditMode ? 'Update your project details' : 'Start organizing your work with a new project'}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Organize tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Set deadlines</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Mark favorites</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </DialogHeader>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="p-4 sm:p-6 lg:p-8"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Project Name */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Project Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your project name"
                          className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Category and Icon Row - Side by side on larger screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Category Field */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Category
                        </FormLabel>
                        <Select onValueChange={value => field.onChange(Number(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors">
                              <SelectValue placeholder="Choose a category for your project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map(category => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Icon Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Project Icon
                        </FormLabel>
                        <FormControl>
                          <IconPicker
                            value={field.value}
                            onChange={field.onChange}
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              </div>

              {/* Due Date Field */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Due Date
                        <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'h-10 sm:h-12 w-full justify-start text-left font-normal border-2 focus:border-primary transition-colors text-sm sm:text-base',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Favorite Checkbox */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <FormField
                  control={form.control}
                  name="isFavorite"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-accent/10 to-secondary/10 border border-accent/20">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                          <Star className="h-4 w-4 text-accent" />
                          Mark as favorite
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">This project will appear in your favorites</p>
                      </div>
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 pt-4 sm:pt-6 border-t border-border"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-10 sm:h-12 px-4 sm:px-6 font-semibold order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || isCategoriesLoading}
                  className="h-10 sm:h-12 px-6 sm:px-8 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200 order-1 sm:order-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isEditMode ? 'Update Project' : 'Create Project'}
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDialog;
