import React from 'react';
import { useIntl, defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import { CourseProvider, useCourse } from 'data/CourseProductsProvider';
import { Spinner } from 'components/Spinner';
import { SaleTunnel } from 'components/SaleTunnel';
import * as Joanie from 'types/Joanie';
import { useOrders } from 'hooks/useOrders';

const messages = defineMessages({
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
  const orders = useOrders();
  const intl = useIntl();

  const formatDate = (date: string) =>
    intl.formatDate(date, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const isOwned = (productId: string) =>
    !!orders.items?.find((o) => o.product === productId && o.course === course.item!.code);

  const generateKey = (tree: object) =>
    Object.entries(tree).reduce((key, [property, value]) => {
      if (key.length > 1) key += '-';
      key += `${property}-${value}`;
      return key;
    }, '');

  if (course.states.fetching) {
    return (
      <Spinner aria-labelledby="loading-course">
        <span id="loading-course">
          <FormattedMessage {...messages.loadingInitial} />
        </span>
      </Spinner>
    );
  }
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
                  <ol className="course-item__course-run-list">
                    {target_course.course_runs.map((courseRun) => (
                      <li
                        key={generateKey({
                          product: product.id,
                          course: course.item!.code,
                          courseRun: courseRun.id,
                        })}
                        className="course-run-item"
                      >
                        <span className="course-run-item__date">{formatDate(courseRun.start)}</span>
                        <span className="course-run-item__date">{formatDate(courseRun.end)}</span>
                      </li>
                    ))}
                  </ol>
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
