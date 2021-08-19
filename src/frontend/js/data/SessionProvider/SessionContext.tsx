import { createContext } from 'react';
import { Maybe, Nullable } from 'types/utils';
import { User } from 'types/User';

export interface SessionContext {
  destroy: () => void;
  login: () => void;
  register: () => void;
  user: Maybe<Nullable<User>>;
}

export const Session = createContext<SessionContext>({} as any);
