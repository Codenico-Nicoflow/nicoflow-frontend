// Single source of mock truth lives in src/mocks/handlers.ts (used by both the
// MSW test server and Storybook). Re-export the factories here under the names
// stories use, so a story import path stays stable while the shapes can't drift.
export {
  makeArea as mockArea,
  makeAreaWithProjects as mockAreaWithProjects,
  makeBucket as mockBucket,
  makeProject as mockProject,
  makeTask as mockTask,
  makeUser as mockUser,
} from '@/mocks/handlers';
