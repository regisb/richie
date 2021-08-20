import React from 'react';
import {
  useIntl,
  FormattedMessage,
  FormattedNumber,
  FormattedPlural,
  defineMessages,
} from 'react-intl';
import * as Joanie from 'types/Joanie';

const messages = defineMessages({
  includingVAT: {
    defaultMessage: 'including VAT',
    description: 'Text displayed next to the price to mention this is the price including VAT.',
    id: 'components.SaleTunnelStepValidation.includingVAT',
  },
  noAvailableCourseRun: {
    defaultMessage: 'No course run available',
    description: 'No course run available text',
    id: 'components.SaleTunnelStepValidation.noAvailableCourseRun',
  },
  availableCourseRun: {
    defaultMessage: 'One course run available',
    description: 'Singular course run available text',
    id: 'components.SaleTunnelStepValidation.availableCourseRun',
  },
  availableCourseRuns: {
    defaultMessage: '{count} course runs available',
    description: 'Plural course runs available text',
    id: 'components.SaleTunnelStepValidation.availableCourseRuns',
  },
  courseRunDates: {
    defaultMessage: 'From {start} to {end}',
    description: 'Course run date text',
    id: 'components.SaleTunnelStepValidation.courseRunDates',
  },
  proceedToPayment: {
    defaultMessage: 'Proceed to payment',
    description: 'CTA to go to payment step',
    id: 'components.SaleTunnelStepValidation.proceedToPayment',
  },
});

interface SaleTunnelStepValidationProps {
  next: () => void;
  product: Joanie.Product;
}

export const SaleTunnelStepValidation = ({ product, next }: SaleTunnelStepValidationProps) => {
  const intl = useIntl();
  const formatDate = (date: string) =>
    intl.formatDate(date, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  return (
    <section className="SaleTunnelStepValidation">
      <header className="SaleTunnelStepValidation__header">
        <h3 className="SaleTunnelStepValidation__title">{product.title}</h3>
        <h4 className="SaleTunnelStepValidation__price">
          <FormattedNumber
            value={product.price}
            style="currency"
            currency={product.currency.code}
          />
          &nbsp;
          <FormattedMessage {...messages.includingVAT} />
        </h4>
      </header>
      <ol className="SaleTunnelStepValidation__product-detail-list">
        {product.target_courses.map((course) => (
          <li
            key={`SaleTunnelStepValidation__product-detail-row--${course.code}`}
            className="SaleTunnelStepValidation__product-detail-row product-detail-row product-detail-row--course"
          >
            <span className="product-detail-row__icon">
              <svg role="img">
                <use href="#icon-check" />
              </svg>
            </span>
            <h5 className="product-detail-row__title">{course.title}</h5>
            <div className="product-detail-row__content product-detail-row__course-run-dates">
              <p className="product-detail-row__course-run-dates__count">
                <svg role="img" width="24">
                  <use href="#icon-calendar" />
                </svg>
                <FormattedPlural
                  value={course.course_runs.length}
                  zero={<FormattedMessage {...messages.noAvailableCourseRun} />}
                  one={<FormattedMessage {...messages.availableCourseRun} />}
                  other={
                    <FormattedMessage
                      {...messages.availableCourseRuns}
                      values={{ count: course.course_runs.length }}
                    />
                  }
                />
              </p>
              <ul className="product-detail-row__course-run-dates__list">
                {course.course_runs.map((courseRun) => (
                  <li className="product-detail-row__course-run-dates__item" key={courseRun.id}>
                    <FormattedMessage
                      {...messages.courseRunDates}
                      values={{
                        start: formatDate(courseRun.start),
                        end: formatDate(courseRun.end),
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
        {product.certificate ? (
          <li className="SaleTunnelStepValidation__product-detail-row product-detail-row product-detail-row--certificate">
            <span className="product-detail-row__icon product-detail-row__icon--big">
              <svg role="img">
                <use href="#icon-certificate" />
              </svg>
            </span>
            <h5 className="product-detail-row__title">{product.certificate.title}</h5>
            {product.certificate.description ? (
              <p className="product-detail-row__content">{product.certificate.description}</p>
            ) : null}
          </li>
        ) : null}
      </ol>
      <footer className="SaleTunnelStepValidation__footer">
        <button className="button button--primary" onClick={next}>
          <FormattedMessage {...messages.proceedToPayment} />
        </button>
      </footer>
    </section>
  );
};
