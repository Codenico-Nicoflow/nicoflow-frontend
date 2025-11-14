import type { UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';

import type { LoginFormData } from '@/lib/utils';

import { Checkbox } from '../ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel } from '../ui/form';

const RememberMe = ({ form }: { form: UseFormReturn<LoginFormData> }) => {
  return (
    <div className="flex justify-between items-center w-80">
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
