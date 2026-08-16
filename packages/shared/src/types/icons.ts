export const ICON_IDS = [
  'folder', // default/general
  'briefcase', // work / career
  'user', // personal
  'heart', // health / wellbeing
  'dollar-sign', // finance / budgeting
  'book', // education / learning
  'lightbulb', // ideas / innovation
  'rocket', // startup / launch
  'palette', // design / creative
  'music', // music / hobbies
  'camera', // photography / media
  'film', // video / media
  'gift', // gifts / events
  'calendar', // planning / schedule
  'shopping-cart', // shopping / e-commerce
  'map', // travel / locations
  'plane', // travel / trips
  'tools', // projects / DIY
  'code', // programming / tech
  'cpu', // IT / tech
  'shield', // security / privacy
  'trophy', // achievements / goals
  'chat', // communication / collaboration
  'clipboard', // Tasks / management
  'flag', // priorities / milestones
  'star', // favorites / important
  'leaf', // nature / sustainability
  'paw', // pets / personal
  'heart-pulse', // fitness / health
  'globe', // global / community
] as const;

export type IconId = (typeof ICON_IDS)[number];
