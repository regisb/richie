import React, { useCallback, PropsWithChildren } from 'react';
import { handle } from 'utils/errors/handle';
import { AuthenticationApi } from 'utils/api/authentication';
import { useQuery, useQueryClient } from 'react-query';
import { Nullable } from 'types/utils';
import { User } from 'types/User';
import { REACT_QUERY_SETTINGS } from 'settings';
import { Session } from './SessionContext';

/**
 * BaseSessionProvider
 *
 * @param children - Elements to render inside SessionProvider
 *
 * @return {Object} Session
 * @return {Object} Session.user - authenticated user information
 * @return {Function} Session.login - redirect to the login page
 * @return {Function} Session.register - redirect to the register page
 * @return {Function} Session.destroy - set Session to undefined then make a request to logout user to the authentication service
 */
const BaseSessionProvider = ({ children }: PropsWithChildren<any>) => {
  /**
   * `user` is:
   * - `undefined` when we have not made the `whoami` request yet;
   * - `null` when the user is anonymous or the request failed;
   * - a user object when the user is logged in.
   */
  const { data: user } = useQuery<Nullable<User>>('user', AuthenticationApi!.me, {
    refetchOnWindowFocus: true,
    staleTime: REACT_QUERY_SETTINGS.staleTimes.session,
  });

  const queryClient = useQueryClient();

  const login = useCallback(() => {
    if (!AuthenticationApi) return handle(new Error('No AuthenticationApi configured!'));

    queryClient.clear();
    AuthenticationApi!.login();
  }, [queryClient]);

  const register = useCallback(() => {
    if (!AuthenticationApi) return handle(new Error('No AuthenticationApi configured!'));

    queryClient.clear();
    AuthenticationApi!.register();
  }, [queryClient]);

  const destroy = useCallback(async () => {
    if (!AuthenticationApi) return handle(new Error('No AuthenticationApi configured!'));

    await AuthenticationApi!.logout();
    /*
      Invalidate all queries except 'user' as we can set it to null manually
      after logout to avoid extra requests
    */
    queryClient.invalidateQueries({ predicate: (query: any) => query.options.queryKey !== 'user' });
    queryClient.setQueryData('user', null);
  }, [queryClient]);

  return <Session.Provider value={{ user, destroy, login, register }}>{children}</Session.Provider>;
};

export default BaseSessionProvider;
