import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  ContextFactory as mockContextFactory,
  FonzieUserFactory,
  PersistedClientFactory,
  ProductFactory,
  QueryStateFactory,
} from 'utils/test/factories';
import { SessionProvider } from 'data/SessionProvider';
import { CourseProvider } from 'data/CourseProductsProvider';
import createQueryClient from 'utils/react-query/createQueryClient';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import { SaleTunnel } from '.';

const StepComponent =
  (title: string) =>
  ({ next }: { next: () => void }) =>
    (
      <React.Fragment>
        <h1>{title}</h1>
        <button onClick={next}>Next</button>
      </React.Fragment>
    );

jest.mock('components/SaleTunnelStepValidation', () => ({
  SaleTunnelStepValidation: StepComponent('SaleTunnelStepValidation Component'),
}));
jest.mock('components/SaleTunnelStepPayment', () => ({
  SaleTunnelStepPayment: StepComponent('SaleTunnelStepPayment Component'),
}));
jest.mock('components/SaleTunnelStepResume', () => ({
  SaleTunnelStepResume: StepComponent('SaleTunnelStepResume Component'),
}));
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).generate(),
}));

describe('SaleTunnel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    fetchMock.restore();
    sessionStorage.clear();
  });

  const initializeUser = (loggedin = true) => {
    const user = loggedin ? FonzieUserFactory.generate() : null;

    sessionStorage.setItem(
      REACT_QUERY_SETTINGS.cacheStorage.key,
      JSON.stringify(
        PersistedClientFactory({ queries: [QueryStateFactory('user', { data: user })] }),
      ),
    );

    if (loggedin) {
      sessionStorage.setItem(RICHIE_USER_TOKEN, user.access_token);
    }

    return user;
  };

  const Wrapper = ({ client, children }: React.PropsWithChildren<{ client: QueryClient }>) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={client}>
        <SessionProvider>
          <CourseProvider code="00000">{children}</CourseProvider>
        </SessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  it('shows a login button if user is not authenticated', async () => {
    initializeUser(false);
    const product = ProductFactory.generate();
    const queryClient = createQueryClient({ persistor: true });

    fetchMock.get('https://joanie.test/api/courses/00000/', []);

    await act(async () => {
      render(
        <Wrapper client={queryClient}>
          <SaleTunnel product={product} />
        </Wrapper>,
      );
    });

    screen.getByRole('button', { name: 'Login to purchase' });
  });

  it('shows cta to open sale tunnel when user is authenticated', async () => {
    initializeUser();
    const product = ProductFactory.generate();
    const queryClient = createQueryClient({ persistor: true });

    fetchMock
      .get('https://joanie.test/api/courses/00000/', [])
      .get('https://joanie.test/api/addresses/', [])
      .get('https://joanie.test/api/credit-cards/', [])
      .get('https://joanie.test/api/orders/', []);

    await act(async () => {
      render(
        <Wrapper client={queryClient}>
          <SaleTunnel product={product} />
        </Wrapper>,
      );
    });

    fetchMock.resetHistory();

    // Only CTA is displayed
    const button = screen.getByRole('button', { name: product.call_to_action });

    // Then user can enter into the sale tunnel and follow its 3 steps
    fireEvent.click(button);

    // - Step 1 : Validation
    screen.getByRole('heading', { level: 1, name: 'SaleTunnelStepValidation Component' });
    let next = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(next);
    expect(fetchMock.calls()).toHaveLength(0);

    // - Step 2 : Payment
    screen.getByRole('heading', { level: 1, name: 'SaleTunnelStepPayment Component' });
    next = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(next);
    expect(fetchMock.calls()).toHaveLength(0);

    // - Step 3 : Resume
    screen.getByRole('heading', { level: 1, name: 'SaleTunnelStepResume Component' });
    next = screen.getByRole('button', { name: 'Next' });

    // - Terminated, resume.onExit callback is triggered to refresh course and orders
    fireEvent.click(next);
    const calls = fetchMock.calls();
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toEqual('https://joanie.test/api/courses/00000/');
    expect(calls[1][0]).toEqual('https://joanie.test/api/orders/');
  });
});
