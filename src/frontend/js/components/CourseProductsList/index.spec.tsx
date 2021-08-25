import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { faker } from '@helpscout/helix';
import fetchMock from 'fetch-mock';
import { act, render, screen } from '@testing-library/react';
import {
  CertificateProductFactory,
  ContextFactory as mockContextFactory,
  CourseFactory,
  PersistedClientFactory,
  ProductOrderFactory,
  ProductFactory,
  QueryStateFactory,
  FonzieUserFactory,
} from 'utils/test/factories';
import * as Joanie from 'types/Joanie';
import { Deferred } from 'utils/test/deferred';
import createQueryClient from 'utils/react-query/createQueryClient';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import { SessionProvider } from 'data/SessionProvider';
import CourseProductsList from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).generate(),
}));

describe('CourseProductsList', () => {
  afterEach(() => {
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
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </IntlProvider>
  );

  it('retrieves course from Joanie API then display related products', async () => {
    const queryClient = createQueryClient();
    const course: Joanie.Course = CourseFactory.extend({
      products: [ProductFactory.generate()],
    }).generate();
    const product = course.products[0];
    const targetCourses = product.target_courses;

    const courseDeferred = new Deferred();
    fetchMock.get(`https://joanie.test/api/courses/${course.code}/`, courseDeferred.promise);

    const { container } = render(
      <Wrapper client={queryClient}>
        <CourseProductsList code={course.code} />
      </Wrapper>,
    );

    screen.getByRole('status', { name: 'Loading course information...' });

    await act(async () => courseDeferred.resolve(course));

    expect(fetchMock.calls()).toHaveLength(1);

    // - Render product title
    const productTitle = screen.getByRole('heading', { level: 3 });
    expect(productTitle).toHaveTextContent(product.title);

    // - Render target courses and certificate titles
    const courseTitles = container.querySelectorAll(
      '.product-item__course-item > h5.course-product-item__row__title',
    );
    expect(courseTitles).toHaveLength(targetCourses.length);
    courseTitles.forEach((title, index) => {
      const targetCourse = targetCourses[index];
      expect(title).toHaveTextContent(targetCourse.title);
    });

    // - Render course runs of each target courses
    const courseRuns = container.querySelectorAll('.course-run-item');
    const courseRunsCount = targetCourses.reduce((count, targetCourse) => {
      count += targetCourse.course_runs.length;
      return count;
    }, 0);
    expect(courseRuns).toHaveLength(courseRunsCount);
  });

  it('renders certificate information when product type is `certificate`', async () => {
    const queryClient = createQueryClient();
    const course = CourseFactory.extend({
      products: [CertificateProductFactory.generate()],
    }).generate();
    const product = course.products[0];
    const certificateDefinition = product.certificate;

    const courseDeferred = new Deferred();
    fetchMock.get(`https://joanie.test/api/courses/${course.code}/`, courseDeferred.promise);

    render(
      <Wrapper client={queryClient}>
        <CourseProductsList code={course.code} />
      </Wrapper>,
    );

    await act(async () => courseDeferred.resolve(course));

    screen.getByRole('heading', { level: 5, name: certificateDefinition.title });
    screen.getByText(certificateDefinition.description);
  });

  it('renders a placeholder in place of certificate description if there is no.', async () => {
    const queryClient = createQueryClient();
    const course = CourseFactory.extend({
      products: [
        CertificateProductFactory.extend({
          certificate: {
            id: faker.datatype.uuid(),
            title: faker.random.words(3),
          },
        }).generate(),
      ],
    }).generate();
    const product = course.products[0];
    const certificateDefinition = product.certificate;

    const courseDeferred = new Deferred();
    fetchMock.get(`https://joanie.test/api/courses/${course.code}/`, courseDeferred.promise);

    render(
      <Wrapper client={queryClient}>
        <CourseProductsList code={course.code} />
      </Wrapper>,
    );

    await act(async () => courseDeferred.resolve(course));

    screen.getByRole('heading', { level: 5, name: certificateDefinition.title });
    screen.getByText(
      'You will be able to download your certificate once you will pass all course runs.',
    );
  });

  it('shows product owned by the authenticated user and course runs which user is enrolled', async () => {
    initializeUser();
    const queryClient = createQueryClient({ persistor: true });
    const [product, order] = ProductOrderFactory().generate();
    const course = CourseFactory.extend({
      products: [product],
      orders: [order],
    }).generate();

    fetchMock
      .get(`https://joanie.test/api/courses/${course.code}/`, course)
      .get('https://joanie.test/api/orders/', { results: [] })
      .get('https://joanie.test/api/addresses/', [])
      .get('https://joanie.test/api/credit-cards/', []);

    await act(async () => {
      render(
        <Wrapper client={queryClient}>
          <SessionProvider>
            <CourseProductsList code={course.code} />
          </SessionProvider>
        </Wrapper>,
      );
    });

    screen.getByRole('heading', { level: 6, name: 'Enrolled' });

    // Button to purchase product is not displayed
    expect(screen.queryByRole('button', { name: product.call_to_action })).toBeNull();

    // Links to access to enrolled course runs are displayed
    expect(screen.queryAllByRole('link', { name: 'Go to course' })).toHaveLength(
      product.target_courses.length,
    );

    // Buttons to unroll to the enrolled course runs are displayed
    expect(screen.queryAllByRole('button', { name: 'Unroll' })).toHaveLength(
      product.target_courses.length,
    );
  });
});
