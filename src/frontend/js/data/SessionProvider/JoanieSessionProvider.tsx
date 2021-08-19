import React, { useCallback, useEffect, useState, PropsWithChildren } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { AuthenticationApi } from 'utils/api/authentication';
import { handle } from 'utils/errors/handle';
import isTestEnv from 'utils/test/isTestEnv';
import { User } from 'types/User';
import { Nullable } from 'types/utils';
import { useCreditCards } from 'hooks/useCreditCards';
import { useAddresses } from 'hooks/useAddresses';
import { useOrders } from 'hooks/useOrders';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import { Session } from './SessionContext';

/**
 * JoanieSessionProvider
 *
 * @param children - Elements to render inside SessionProvider
 *
 * @return {Object} Session
 * @return {Object} Session.user - authenticated user information
 * @return {Function} Session.login - redirect to the login page
 * @return {Function} Session.register - redirect to the register page
 * @return {Function} Session.destroy - set Session to undefined then make a request to logout user to the authentication service
 */
const JoanieSessionProvider = ({ children }: PropsWithChildren<any>) => {
  /**
   * `user` is:
   * - `undefined` when we have not made the `whoami` request yet;
   * - `null` when the user is anonymous or the request failed;
   * - a user object when the user is logged in.
   */
  const [refetchInterval, setRefetchInterval] = useState<false | number>(false);
  const { data: user, isStale } = useQuery<Nullable<User>>('user', AuthenticationApi!.me, {
    refetchOnWindowFocus: true,
    refetchInterval,
    staleTime: REACT_QUERY_SETTINGS.staleTimes.session,
    onError: () => {
      sessionStorage.removeItem(RICHIE_USER_TOKEN);
    },
    onSuccess: (data) => {
      sessionStorage.removeItem(RICHIE_USER_TOKEN);
      if (data) {
        sessionStorage.setItem(RICHIE_USER_TOKEN, data.access_token!);
      }
    },
  });

  const queryClient = useQueryClient();
  const addresses = useAddresses();
  const creditCards = useCreditCards();
  const orders = useOrders();

  const login = useCallback(() => {
    if (!AuthenticationApi) return handle(new Error('No AuthenticationApi configured!'));

    sessionStorage.removeItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    sessionStorage.removeItem(RICHIE_USER_TOKEN);
    AuthenticationApi!.login();
  }, [queryClient]);

  const register = useCallback(() => {
    if (!AuthenticationApi) return handle(new Error('No AuthenticationApi configured!'));

    sessionStorage.removeItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    sessionStorage.removeItem(RICHIE_USER_TOKEN);
    AuthenticationApi!.register();
  }, [queryClient]);

  const destroy = useCallback(async () => {
    if (!AuthenticationApi) return handle(new Error('No AuthenticationApi configured!'));

    await AuthenticationApi!.logout();
    /*
      Invalidate all queries except 'user' as we can set it to null manually
      after logout to avoid extra requests
    */
    sessionStorage.removeItem(RICHIE_USER_TOKEN);
    queryClient.removeQueries({
      predicate: (queries: any) => {
        return queries.options.queryKey !== 'user';
      },
    });
    queryClient.setQueryData('user', null);
  }, [queryClient]);

  useEffect(() => {
    if (user && !isStale) {
      addresses.methods.prefetch();
      // FIXME: Uncomment credit card prefetching !!!
      creditCards.methods.prefetch();
      orders.methods.prefetch();
    }

    if (!isTestEnv) {
      // We do not want enable refetchInterval during tests as it can pollute
      // the fetchMock when we use fake timers.
      if (user) {
        setRefetchInterval(REACT_QUERY_SETTINGS.staleTimes.session);
      } else {
        setRefetchInterval(false);
      }
    }
  }, [user]);

  return <Session.Provider value={{ user, destroy, login, register }}>{children}</Session.Provider>;
};

export default JoanieSessionProvider;
