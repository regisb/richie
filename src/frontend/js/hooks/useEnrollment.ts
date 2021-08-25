import { useMutation, useQueryClient } from 'react-query';
import { APIResponseError } from 'types/api';
import API from 'utils/api/joanie';

export const useEnrollment = () => {
  const queryClient = useQueryClient();

  const handleSettled = () => queryClient.invalidateQueries(['user', 'orders']);
  const handleError = (error: APIResponseError) => {
    if (error.code === 401) {
      queryClient.invalidateQueries('user');
    }
  };

  const writeHandlers = {
    create: useMutation(API().user.enrollments.create, {
      onError: handleError,
      onSettled: handleSettled,
    }),
    update: useMutation(API().user.enrollments.update, {
      onError: handleError,
      onSettled: handleSettled,
    }),
  };

  return {
    methods: {
      create: writeHandlers.create.mutateAsync,
      update: writeHandlers.update.mutateAsync,
    },
    states: {
      creating: writeHandlers.create.isLoading,
      updating: writeHandlers.create.isLoading,
    },
  };
};
