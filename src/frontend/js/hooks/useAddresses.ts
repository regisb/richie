import { useMutation, useQuery, useQueryClient } from 'react-query';
import API from 'utils/api/joanie';
import { useSession } from 'data/SessionProvider';
import { REACT_QUERY_SETTINGS } from 'settings';
import { APIResponseError } from 'types/api';

/**
 * Joanie hook to retrieve/create/update/delete addresses
 * owned by the authenticated user.
 *
 */
export const useAddresses = () => {
  const QUERY_KEY = ['user', 'addresses'];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const handleError = (error: APIResponseError) => {
    if (error.code === 401) {
      queryClient.invalidateQueries('user');
    }
  };

  const prefetch = async () => {
    await queryClient.prefetchQuery(QUERY_KEY, () => API().user.addresses.get(), {
      staleTime: REACT_QUERY_SETTINGS.staleTimes.sessionItems,
    });
  };

  const readHandler = useQuery(QUERY_KEY, () => API().user.addresses.get(), {
    enabled: !!user,
    staleTime: REACT_QUERY_SETTINGS.staleTimes.sessionItems,
    onError: handleError,
  });

  const invalidate = () => {
    queryClient.invalidateQueries(QUERY_KEY);
  };

  const writeHandlers = {
    create: useMutation(API().user.addresses.create, {
      onError: handleError,
      onSettled: invalidate,
    }),
    update: useMutation(API().user.addresses.update, {
      onError: handleError,
      onSettled: invalidate,
    }),
    delete: useMutation(API().user.addresses.delete, {
      onError: handleError,
      onSettled: invalidate,
    }),
  };

  return {
    items: readHandler.data || [],
    methods: {
      invalidate,
      prefetch,
      refetch: readHandler.refetch,
      create: writeHandlers.create.mutate,
      update: writeHandlers.update.mutate,
      delete: writeHandlers.delete.mutate,
    },
    states: {
      fetching: readHandler.isLoading,
      creating: writeHandlers.create.isLoading,
      deleting: writeHandlers.delete.isLoading,
      updating: writeHandlers.update.isLoading,
    },
  };
};
