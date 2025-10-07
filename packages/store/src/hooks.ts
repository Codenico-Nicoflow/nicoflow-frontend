import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from './store';
import type { IUser } from '@my-monorepo/types';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: <T>(selector: (state: RootState) => T) => T = useSelector;
export const useAppUser = () => useAppSelector((state): IUser | null => state.auth.user);
