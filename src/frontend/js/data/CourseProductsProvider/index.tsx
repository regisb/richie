import React, { createContext, useContext } from 'react';
import { useQuery, QueryObserverBaseResult, useQueryClient } from 'react-query';
import { Maybe } from 'types/utils';
import { Course } from 'types/Joanie';
import API from 'utils/api/joanie';
import { useSession } from 'data/SessionProvider';
import { REACT_QUERY_SETTINGS } from 'settings';
import { APIResponseError } from 'types/api';

interface Context {
  item: Maybe<Course>;
  methods: {
    invalidate: () => void;
    refetch: QueryObserverBaseResult['refetch'];
  };
  states: {
    fetching: boolean;
  };
}

const CourseContext = createContext<Maybe<Context>>(undefined);

export const CourseProvider: React.FC<{ code: string }> = ({ code, children }) => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const QUERY_KEY = user ? ['user', 'course', code] : ['course', code];
  const {
    data: course,
    refetch,
    isLoading,
  } = useQuery(QUERY_KEY, () => API().courses.get(code), {
    staleTime: user
      ? REACT_QUERY_SETTINGS.staleTimes.sessionItems
      : REACT_QUERY_SETTINGS.staleTimes.default,
    onError: (error: APIResponseError) => {
      if (error.code === 401) {
        queryClient.invalidateQueries('user');
      }
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries(QUERY_KEY);
  };

  const context = {
    item: course,
    methods: {
      invalidate,
      refetch,
    },
    states: { fetching: isLoading },
  };

  return <CourseContext.Provider value={context}>{children}</CourseContext.Provider>;
};

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a component wrapped by a <CourseProvider />.');
  }
  return context;
};
