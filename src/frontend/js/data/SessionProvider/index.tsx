import React, { Suspense, lazy, useContext, PropsWithChildren } from 'react';
import { isJoanieEnabled } from 'utils/api/joanie';
import { Session } from './SessionContext';

/**
 * useSession
 *
 * An utils to manage user session in Richie
 * User session information are extracted from OpenEdX cookies.
 * This means that OpenEdX and Richie must be accessible through the same domain and
 * OpenEdX must be configured to share cookies to Richie sub domain.
 *
 * "edxloggedin" cookie is used to know if an OpenEdX session is active or not,
 * then user information are extracted from "edx-user-info" cookie.
 *
 * useSession use a context to dispatch any change to all react widgets.
 *
 */

const LazyBaseSessionProvider = lazy(() => import('./BaseSessionProvider'));
const LazyJoanieSessionProvider = lazy(() => import('./JoanieSessionProvider'));

export const SessionProvider = ({ children, ...props }: PropsWithChildren<any>) => (
  <Suspense fallback="loading...">
    {isJoanieEnabled ? (
      <LazyJoanieSessionProvider {...props}>{children}</LazyJoanieSessionProvider>
    ) : (
      <LazyBaseSessionProvider {...props}>{children}</LazyBaseSessionProvider>
    )}
  </Suspense>
);

export const useSession = () => useContext(Session);
