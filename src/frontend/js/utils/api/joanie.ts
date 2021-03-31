/**
 *
 * Joanie API Implementation
 *
 * This implementation is used for Joanie
 *
 */
import { stringify } from 'query-string';
import * as Joanie from 'types/Joanie';
import context from 'utils/context';
import { AuthenticationApi } from 'utils/api/authentication';
import { handle } from 'utils/errors/handle';

interface CheckStatusOptions {
  fallbackValue: any;
  ignoredErrorStatus: number[];
}
function checkStatus(
  response: Response,
  options: CheckStatusOptions = { fallbackValue: null, ignoredErrorStatus: [] },
): Promise<any> {
  if (response.ok) {
    return response.json();
  }
  if (options.ignoredErrorStatus.includes(response.status)) {
    return Promise.resolve(options.fallbackValue);
  }
  // eslint-disable-next-line prefer-promise-reject-errors
  return Promise.reject({ code: response.status, message: response.statusText });
}

function getDefaultHeaders(): Record<string, string> {
  const $html = document.querySelector('html');
  const language = $html?.getAttribute('lang') || 'en-US';

  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': language,
  };

  return headers;
}

/*
  MARK Does it exist something safer?
  Yes Cookie with HTTP-ONLY
*/
function fetchWithJWT(routes: RequestInfo, options: RequestInit = {}) {
  try {
    const accessToken = AuthenticationApi!.accessToken!();
    const headers = (options.headers as Record<string, string>) || {};

    if (accessToken) {
      const bearer = `Bearer ${accessToken}`;
      // eslint-disable-next-line @typescript-eslint/dot-notation
      headers['Authorization'] = bearer;
    }

    options.headers = headers;

    return fetch(routes, options);
  } catch (error) {
    throw new Error(
      `Joanie requires JWT Token to fetch data, but the configured authentication
      api does not contains a method \`accessToken\` to retrieve this information.`,
    );
  }
}

type Header = Record<string, string>;
const header: Header = { 'Content-Type': 'application/json' };
header.Authorization = 'test';

/**
 * Handle the error then return the fallback value to not break the execution stack or the error
 * if no fallback_value has been provided.
 * @param fallback_value
 * @return handler
 */
const handleError = (fallback_value?: unknown) => (error: Error) => {
  handle(error);
  if (fallback_value === undefined) {
    throw error;
  }
  return fallback_value;
};

/**
 * Flag which determines if joanie is enabled.
 */
export const isJoanieEnabled = !!context.joanie_backend;

const API = (): Joanie.API => {
  const configuration = context.joanie_backend;

  if (!configuration) {
    throw new Error('[JOANIE] - Joanie is not configured.');
  }

  const ROUTES = {
    user: {
      creditCards: {
        get: configuration.endpoint.concat('/api/credit-cards/:id/'),
        create: configuration.endpoint.concat('/api/credit-cards/'),
        update: configuration.endpoint.concat('/api/credit-cards/:id/'),
        delete: configuration.endpoint.concat('/api/credit-cards/:id/'),
      },
      addresses: {
        get: configuration.endpoint.concat('/api/addresses/:id/'),
        create: configuration.endpoint.concat('/api/addresses/'),
        update: configuration.endpoint.concat('/api/addresses/:id/'),
        delete: configuration.endpoint.concat('/api/addresses/:id/'),
      },
      orders: {
        create: configuration.endpoint.concat('/api/orders/'),
        get: configuration.endpoint.concat('/api/orders/:id/'),
      },
      certificates: {
        // TODO Add Joanie certificate routes
      },
      enrollments: {
        get: configuration.endpoint.concat('/api/enrollments/:id/'),
        create: configuration.endpoint.concat('/api/enrollments/'),
        update: configuration.endpoint.concat('/api/enrollments/:id/'),
      },
    },
    courses: {
      get: configuration.endpoint.concat('/api/courses/:id/'),
    },
    courseRuns: {
      // TODO Add Joanie course run routes
    },
  };

  return {
    user: {
      creditCards: {
        get: async (id?: string) => {
          let url;

          if (id) url = ROUTES.user.creditCards.get.replace(':id', id);
          else url = ROUTES.user.creditCards.get.replace(':id/', '');

          return fetchWithJWT(url, {
            headers: getDefaultHeaders(),
          })
            .then(checkStatus)
            .catch(handleError([]));
        },
        create: async (creditCard) =>
          fetchWithJWT(ROUTES.user.creditCards.create, {
            method: 'POST',
            headers: getDefaultHeaders(),
            body: JSON.stringify(creditCard),
          })
            .then(checkStatus)
            .catch(handleError()),
        update: async ({ id, ...creditCard }) =>
          fetchWithJWT(ROUTES.user.creditCards.create.replace(':id', id), {
            method: 'PUT',
            headers: getDefaultHeaders(),
            body: JSON.stringify(creditCard),
          })
            .then(checkStatus)
            .catch(handleError()),
        delete: async (id) =>
          fetchWithJWT(ROUTES.user.creditCards.create.replace(':id', id), {
            method: 'DELETE',
            headers: getDefaultHeaders(),
          })
            .then(checkStatus)
            .catch(handleError()),
      },
      addresses: {
        get: (id?: string) => {
          let url;

          if (id) url = ROUTES.user.addresses.get.replace(':id', id);
          else url = ROUTES.user.addresses.get.replace(':id/', '');

          return fetchWithJWT(url, {
            headers: getDefaultHeaders(),
          })
            .then(checkStatus)
            .catch(handleError([]));
        },
        create: async (payload) =>
          fetchWithJWT(ROUTES.user.addresses.create, {
            method: 'POST',
            headers: getDefaultHeaders(),
            body: JSON.stringify(payload),
          })
            .then(checkStatus)
            .catch(handleError([])),
        update: async ({ id, ...address }) =>
          fetchWithJWT(ROUTES.user.addresses.update.replace(':id', id), {
            method: 'PUT',
            headers: getDefaultHeaders(),
            body: JSON.stringify(address),
          })
            .then(checkStatus)
            .catch(handleError()),
        delete: async (id) =>
          fetchWithJWT(ROUTES.user.addresses.delete.replace(':id', id), {
            method: 'DELETE',
            headers: getDefaultHeaders(),
          })
            .then(checkStatus)
            .catch(handleError()),
      },
      orders: {
        create: async (payload) =>
          fetchWithJWT(ROUTES.user.orders.create, {
            method: 'POST',
            headers: getDefaultHeaders(),
            body: JSON.stringify(payload),
          }).then(checkStatus),
        get: async (arg1) => {
          let url;
          let queryParameters;

          if (typeof arg1 === 'string') {
            url = ROUTES.user.orders.get.replace(':id', arg1);
          } else {
            url = ROUTES.user.orders.get.replace(':id/', '');
            queryParameters = stringify(arg1 || {});
          }

          if (queryParameters) {
            url += `?${queryParameters}`;
          }

          return fetchWithJWT(url).then(checkStatus).catch(handleError(null));
        },
      },
      enrollments: {
        create: async (payload) =>
          fetchWithJWT(ROUTES.user.enrollments.create, {
            method: 'POST',
            headers: getDefaultHeaders(),
            body: JSON.stringify(payload),
          }).then(checkStatus),
        get: async (arg1) => {
          let url;
          let queryParameters;

          if (typeof arg1 === 'string') {
            url = ROUTES.user.enrollments.get.replace(':id', arg1);
          } else {
            url = ROUTES.user.enrollments.get.replace(':id/', '');
            queryParameters = stringify(arg1 || {});
          }

          if (queryParameters) {
            url += `?${queryParameters}`;
          }

          return fetchWithJWT(url).then(checkStatus).catch(handleError());
        },
        update: async ({ id, ...payload }) =>
          fetchWithJWT(ROUTES.user.enrollments.update.replace(':id', id), {
            method: 'PUT', // MARK or PATCH ?
            headers: getDefaultHeaders(),
            body: JSON.stringify(payload),
          })
            .then(checkStatus)
            .catch(handleError()),
      },
      certificates: {},
    },
    courses: {
      get: async (id) =>
        fetchWithJWT(ROUTES.courses.get.replace(':id', id), {
          headers: getDefaultHeaders(),
        })
          .then((response) =>
            checkStatus(response, { fallbackValue: null, ignoredErrorStatus: [404] }),
          )
          .catch(handleError()),
    },
    courseRuns: {},
  };
};

export default API;
