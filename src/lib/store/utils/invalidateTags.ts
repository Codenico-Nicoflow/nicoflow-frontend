import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import type { TagDescription } from '@reduxjs/toolkit/query';

type InvalidateApi<TagType extends string> = {
  util: {
    invalidateTags: (tags: (TagDescription<TagType> | null | undefined)[]) => UnknownAction;
  };
};

export const invalidateApiTags = <TagType extends string>(
  dispatch: Dispatch<UnknownAction>,
  api: InvalidateApi<TagType>,
  tags: readonly (TagDescription<TagType> | null | undefined)[]
) => {
  dispatch(api.util.invalidateTags([...tags]));
};
