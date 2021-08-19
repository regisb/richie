import { useMutation, useQuery, useQueryClient } from 'react-query';
import API from 'utils/api/joanie';
import { useSession } from 'data/SessionProvider';
import { REACT_QUERY_SETTINGS } from 'settings';
import { APIResponseError } from 'types/api';

/**
 * Joanie hook to retrieve/create/update/delete credit cards
 * owned by the authenticated user.
 *
 */
export const useCreditCards = () => {
  const QUERY_KEY = ['user', 'credit-cards'];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const handleError = (error: APIResponseError) => {
    if (error.code === 401) {
      queryClient.invalidateQueries('user');
    }
  };

  const prefetch = async () => {
    await queryClient.prefetchQuery(QUERY_KEY, () => API().user.creditCards.get(), {
      staleTime: REACT_QUERY_SETTINGS.staleTimes.sessionItems,
    });
  };

  const invalidate = () => {
    queryClient.invalidateQueries(QUERY_KEY);
  };

  const readHandler = useQuery(QUERY_KEY, () => API().user.creditCards.get(), {
    enabled: !!user,
    staleTime: REACT_QUERY_SETTINGS.staleTimes.sessionItems,
  });

  const writeHandlers = {
    create: useMutation(API().user.creditCards.create, {
      onError: handleError,
      onSettled: invalidate,
    }),
    update: useMutation(API().user.creditCards.update, {
      onError: handleError,
      onSettled: invalidate,
    }),
    delete: useMutation(API().user.creditCards.delete, {
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
