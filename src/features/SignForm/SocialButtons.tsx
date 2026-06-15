import React from 'react';

import { FacebookIcon, GmailIcon } from '@/assets/svgs';
import { Divider } from '@/components';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function SocialButtons() {
  return (
    <React.Fragment>
      <div className="flex items-center justify-center w-full my-6">
        <Divider />
        <span className="px-8 text-sm text-muted-foreground cursor-default whitespace-nowrap">or continue with</span>
        <Divider />
      </div>

      <TooltipProvider>
        <div className="flex items-center justify-center gap-4 w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled
                aria-disabled="true"
                aria-label="Continue with Google (coming soon)"
                className="p-2.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-not-allowed opacity-60"
              >
                <GmailIcon />
              </button>
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled
                aria-disabled="true"
                aria-label="Continue with Facebook (coming soon)"
                className="p-2.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-not-allowed opacity-60"
              >
                <FacebookIcon />
              </button>
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </React.Fragment>
  );
}
