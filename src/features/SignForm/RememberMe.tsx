import type { UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import type { LoginFormData } from '@/lib/utils';

const RememberMe = ({ form }: { form: UseFormReturn<LoginFormData> }) => {
  return (
    <div className="flex justify-between items-center w-full">
      <FormField
        control={form.control}
        name="remember"
        defaultValue={false}
        render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={value => field.onChange(!!value)}
                defaultChecked={false}
              />
            </FormControl>
            <FormLabel>Remember me</FormLabel>
          </FormItem>
        )}
      />

      <Link className="text-sm text-primary hover:underline hover:text-primary/80" to="/forgot-password">
        Forgot password?
      </Link>
    </div>
  );
};

export default RememberMe;
