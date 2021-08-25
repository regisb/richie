import React from 'react';
import { defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import { CourseProvider, useCourse } from 'data/CourseProductsProvider';
import { Spinner } from 'components/Spinner';
import { SaleTunnel } from 'components/SaleTunnel';
import * as Joanie from 'types/Joanie';
import { CourseRunList, EnrollCourseRunList, EnrolledCourseRun } from './CourseRunItems';

export const messages = defineMessages({
  enrolled: {
    defaultMessage: 'Enrolled',
    description: 'Message displayed when authenticated user owned the product',
    id: 'components.CourseProductsList.enrolled',
  },
  start: {
    defaultMessage: 'Start',
    description: 'Start label displayed in the header of course run dates section',
    id: 'components.CourseProductsList.start',
  },
  end: {
    defaultMessage: 'End',
    description: 'End label displayed in the header of course run dates section',
    id: 'components.CourseProductsList.end',
  },
  certificateExplanation: {
    defaultMessage:
      'You will be able to download your certificate once you will pass all course runs.',
    description: 'Text displayed when the product certificate has no description',
    id: 'components.CourseProductsList.certificateExplanation',
  },
  enroll: {
    defaultMessage: 'Enroll',
    description: 'Text label for the enroll button',
    id: 'components.CourseProductsList.enroll',
  },
  loadingInitial: {
    defaultMessage: 'Loading course information...',
    description:
      'Accessible text for the initial loading spinner displayed when course is fetching',
    id: 'components.CourseProductsList.loadingInitial',
  },
});

interface Props {
  code: Joanie.Course['code'];
}

const List = () => {
  const course = useCourse();

  const getProductOrder = (productId: Joanie.Course['products'][0]['id']) => {
    return course.item?.orders?.find((order) => order.product === productId);
  };

  const isOwned = (productId: Joanie.Course['products'][0]['id']) => {
    return Boolean(getProductOrder(productId));
  };

  const getCourseRunEnrollment = (
    productId: string,
    targetCourse: Joanie.CourseProductTargetCourse,
  ) => {
    const resourceLinks = targetCourse.course_runs.map(({ resource_link }) => resource_link);
    const order = course.item?.orders?.find(({ product }) => product === productId);
    if (!order) return undefined;

    const enrollment = order.enrollments.find(({ is_active, resource_link }) => {
      return is_active && resourceLinks.includes(resource_link);
    });

    return enrollment;
  };

  const isEnrolled = (productId: string, targetCourse: Joanie.CourseProductTargetCourse) => {
    return !!getCourseRunEnrollment(productId, targetCourse)?.is_active;
  };

  const generateKey = (tree: object) =>
    Object.entries(tree).reduce((key, [property, value]) => {
      if (key.length > 1) key += '-';
      key += `${property}-${value}`;
      return key;
    }, '');

  // - useCourse hook is fetching data
  if (course.states.fetching) {
    return (
      <Spinner aria-labelledby="loading-course">
        <span id="loading-course">
          <FormattedMessage {...messages.loadingInitial} />
        </span>
      </Spinner>
    );
  }

  // - There is no related course from Joanie
  if (!course.item) return null;

  return (
    <React.Fragment>
      {course.item.products.map((product) => (
        <section key={generateKey({ product: product.id })} className="product-item">
          <header className="product-item__header">
            <h3 className="product-item__title">{product.title}</h3>
            <h6 className="product-item__price">
              {isOwned(product.id) ? (
                <FormattedMessage {...messages.enrolled} />
              ) : (
                <FormattedNumber
                  currency={product.currency.code}
                  value={product.price}
                  style="currency"
                />
              )}
            </h6>
          </header>
          <ol className="product-item-content">
            {product.target_courses.map((target_course) => (
              <li
                key={generateKey({ product: product.id, course: target_course.code })}
                className="product-item__row product-item__course-item"
              >
                <h5 className="course-product-item__row__title">{target_course.title}</h5>
                <section className="course-item__course-run-wrapper">
                  <header className="course-item__course-run-header">
                    <strong>
                      <FormattedMessage {...messages.start} />
                    </strong>
                    <strong>
                      <FormattedMessage {...messages.end} />
                    </strong>
                  </header>
                  {!isOwned(product.id) && (
                    <CourseRunList
                      baseKey={generateKey({ product: product.id, course: target_course.code })}
                      courseRuns={target_course.course_runs}
                    />
                  )}
                  {isOwned(product.id) && !isEnrolled(product.id, target_course) && (
                    <EnrollCourseRunList
                      baseKey={generateKey({ product: product.id, course: target_course.code })}
                      courseRuns={target_course.course_runs}
                      order={getProductOrder(product.id)!}
                    />
                  )}
                  {isOwned(product.id) && isEnrolled(product.id, target_course) && (
                    <EnrolledCourseRun
                      courseRun={getCourseRunEnrollment(product.id, target_course)!}
                    />
                  )}
                </section>
              </li>
            ))}
            {product.certificate && (
              <li className="product-item__row product-item__certificate-item">
                <svg className="certificate-item__icon" role="img" viewBox="0 0 25 34">
                  <use href="#icon-certificate" />
                </svg>
                <div>
                  <h5 className="product-item__row__title">{product.certificate.title}</h5>
                  <p className="product-item__row__description">
                    {product.certificate.description || (
                      <FormattedMessage {...messages.certificateExplanation} />
                    )}
                  </p>
                </div>
              </li>
            )}
          </ol>
          {!isOwned(product.id) ? (
            <footer className="product-item__footer">
              <SaleTunnel product={product} />
            </footer>
          ) : null}
        </section>
      ))}
    </React.Fragment>
  );
};

const CourseProductsList = ({ code }: Props) => (
  <CourseProvider code={code}>
    <List />
  </CourseProvider>
);

export default CourseProductsList;
