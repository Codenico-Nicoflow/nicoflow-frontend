import React from 'react';

import { FacebookIcon, GmailIcon } from '@/assets/svgs';

import Divider from '../ui/divider';

export default function SocialButtons() {
  return (
    <React.Fragment>
      <div className="flex items-center justify-center w-full my-6">
        <Divider />
        <span className="px-4 text-sm text-muted-foreground bg-background cursor-default">Social accounts</span>
        <Divider />
      </div>

      <div className="flex items-center justify-center gap-4 w-full my-6">
        <div
          onClick={() => console.log('Facebook login')}
          className="cursor-pointer p-2 hover:opacity-80 transition-opacity"
        >
          <FacebookIcon />
        </div>
        <div
          onClick={() => console.log('Gmail login')}
          className="cursor-pointer p-2 hover:opacity-80 transition-opacity"
        >
          <GmailIcon />
        </div>
      </div>
    </React.Fragment>
  );
}
