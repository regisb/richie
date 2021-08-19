import React from 'react';
import { QueryClientProvider, QueryClient } from 'react-query';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import { act, render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import {
  ContextFactory as mockContextFactory,
  PersistedClientFactory,
  QueryStateFactory,
} from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import { Deferred } from 'utils/test/deferred';
import { REACT_QUERY_SETTINGS } from 'settings';
import { useSession } from '.';
import BaseSessionProvider from './BaseSessionProvider';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: {
      endpoint: 'https://endpoint.test',
      backend: 'openedx-hawthorn',
    },
    joanie_backend: {
      endpoint: 'https://joanie.test',
    },
  }).generate(),
}));

describe('SessionProvider', () => {
  const queryClient = createQueryClient({ persistor: true });

  const wrapper = ({
    client = queryClient,
    children,
  }: React.PropsWithChildren<{ client: QueryClient }>) => (
    <QueryClientProvider client={client}>
      <BaseSessionProvider>{children}</BaseSessionProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.resetModules();
    fetchMock.restore();
    queryClient.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('uses BaseSessionProvider if joanie is disabled', async () => {
    jest.doMock('../../utils/api/joanie.ts', () => ({
      isJoanieEnabled: false,
    }));
    jest.doMock('./BaseSessionProvider', () => ({
      __esModule: true,
      default: () => 'BaseSessionProvider',
    }));
    jest.doMock('./JoanieSessionProvider', () => ({
      __esModule: true,
      default: () => 'JoanieSessionProvider',
    }));
    const { SessionProvider: Provider } = await import('.');

    render(<Provider />);

    await screen.findByText('BaseSessionProvider');
  });

  it('uses JoanieSessionProvider if joanie is enabled', async () => {
    jest.doMock('../../utils/api/joanie.ts', () => ({
      isJoanieEnabled: true,
    }));
    jest.doMock('./BaseSessionProvider', () => ({
      __esModule: true,
      default: () => 'BaseSessionProvider',
    }));
    jest.doMock('./JoanieSessionProvider', () => ({
      __esModule: true,
      default: () => 'JoanieSessionProvider',
    }));
    const { SessionProvider: Provider } = await import('.');

    render(<Provider />);

    await screen.findByText('JoanieSessionProvider');
  });

  // - useSession Provider test suite
  describe('useSession', () => {
    it('provides a null user if whoami return 401', async () => {
      const userDeferred = new Deferred();
      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);

      const { result } = renderHook(() => useSession(), {
        wrapper,
        initialProps: { client: queryClient },
      });

      await act(async () => userDeferred.resolve(401));

      expect(result.current.user).toBeNull();
      expect(result.all).toHaveLength(2);

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      const cacheString = sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key);
      expect(cacheString).not.toBeNull();

      const client = JSON.parse(cacheString!);
      expect(client.clientState.queries).toHaveLength(1);
      expect(client.clientState.queries[0].queryKey).toEqual('user');
    });

    it('provides user infos if user is authenticated then stores in cache', async () => {
      const username = faker.internet.userName();
      const userDeferred = new Deferred();
      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
      const { result } = renderHook(useSession, { wrapper });

      await act(async () => {
        userDeferred.resolve({ username });
        jest.runAllTimers();
      });

      expect(result.current.user).toStrictEqual({ username });
      expect(result.all).toHaveLength(2);
      const cacheString = sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key);
      expect(cacheString).not.toBeNull();
      expect(cacheString).toContain(username);
    });

    it('destroy session then logout', async () => {
      const username = faker.internet.userName();
      const userDeferred = new Deferred();

      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
      fetchMock.get('https://endpoint.test/logout', 200);
      const { result } = renderHook(useSession, { wrapper });

      await act(async () => {
        userDeferred.resolve({ username });
        jest.runAllTimers();
      });

      const { user, destroy } = result.current;
      expect(user).toStrictEqual({ username });
      expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key) || '').toContain(
        username,
      );

      await act(async () => {
        await destroy();
        jest.runAllTimers();
      });

      expect(result.current.user).toBeNull();
      expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key) || '').toMatch(
        /"data":null,.*"queryKey":"user"/,
      );
    });

    it('does not make request if there is a valid session in cache', async () => {
      const username = faker.internet.userName();
      const persistedClient = PersistedClientFactory({
        queries: [QueryStateFactory('user', { data: { username } })],
      });
      sessionStorage.setItem(
        REACT_QUERY_SETTINGS.cacheStorage.key,
        JSON.stringify(persistedClient),
      );

      fetchMock.get('https://endpoint.test/api/user/v1/me', 200);

      let client: QueryClient;
      await waitFor(() => {
        client = createQueryClient({ persistor: true });
      });

      const { result } = renderHook(useSession, {
        wrapper,
        initialProps: { client: client! },
      });

      expect(result.current.user).toStrictEqual({ username });
      expect(fetchMock.called()).toBeFalsy();
    });

    // it('manages well unauthorized errors', async () => {
    //   fetchMock
    //     .get('https://endpoint.test/api/v1.0/user/me', { username: 'john', access_token: 'test' })
    //     .get('https://joanie.test/api/orders/', [])
    //     .get('https://joanie.test/api/addresses/', [])
    //     .get('https://joanie.test/api/courses/00000/', CourseFactory.generate());

    //   render(
    //     <QueryClientProvider client={createQueryClient({ persistor: true })}>
    //       <JoanieSessionProvider>
    //         <CourseProvider code="00000" />
    //       </JoanieSessionProvider>
    //     </QueryClientProvider>,
    //   );

    //   act(() => {
    //     jest.runOnlyPendingTimers();
    //   });

    //   await waitFor(() => {
    //     expect(fetchMock.calls()).toHaveLength(5);
    //   });

    //   for (const call of fetchMock.calls()) {
    //     console.log(call);
    //   }
    // });
  });
});
