import { USER_STATUS } from '../constants';

export interface IUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  theme: 'light' | 'dark';
  status: (typeof USER_STATUS)[keyof typeof USER_STATUS];
  imageUrl?: string;
}

export interface IUserStore {
  user: IUser | null;
  isLoading: boolean;
  setUser: (user: IUser | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (user: IUser) => void;
  signOut: () => void;
}
