import React, { ReactEventHandler, useRef, useState } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import * as Joanie from 'types/Joanie';
import { useEnrollment } from 'hooks/useEnrollment';
import { Spinner } from 'components/Spinner';
import { useCourse } from 'data/CourseProductsProvider';
import { Maybe } from 'types/utils';
import { messages } from '.';

interface CourseRunListProps {
  baseKey: string;
  courseRuns: Joanie.CourseRun[];
}

export const CourseRunList = ({ baseKey, courseRuns }: CourseRunListProps) => {
  const intl = useIntl();

  const formatDate = (date: string) =>
    intl.formatDate(date, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <ol className="course-item__course-run-list">
      {courseRuns.map((courseRun) => (
        <li key={`${baseKey}-${courseRun.id}`} className="course-run-item">
          <span className="course-run-item__date">{formatDate(courseRun.start)}</span>
          <span className="course-run-item__date">{formatDate(courseRun.end)}</span>
        </li>
      ))}
    </ol>
  );
};

interface EnrollCourseRunListProps extends CourseRunListProps {
  order: Joanie.OrderLite;
}

export const EnrollCourseRunList = ({ baseKey, courseRuns, order }: EnrollCourseRunListProps) => {
  const intl = useIntl();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedCourseRun, setSelectedCourseRun] = useState<Maybe<any>>();
  const enrollment = useEnrollment();
  const course = useCourse();

  const handleChange = () => {
    const form = formRef.current;
    const selectedInput = Array.from(form?.elements || [])
      .filter((element) => element instanceof HTMLInputElement)
      .find((element) => {
        if (element instanceof HTMLInputElement) {
          return !!element?.checked;
        }
        return false;
      });

    const courseRunId = selectedInput?.id.split('|')[1];
    const courseRun = courseRuns.find(({ resource_link }) => resource_link === courseRunId);
    setSelectedCourseRun(courseRun);
  };

  const handleEnroll: ReactEventHandler<HTMLButtonElement> = async (event) => {
    event.preventDefault();
    if (selectedCourseRun) {
      const relatedEnrollment = order.enrollments.find(({ resource_link }) => {
        return resource_link === selectedCourseRun.resource_link;
      });
      if (relatedEnrollment) {
        await enrollment.methods.update({
          is_active: true,
          course_run: selectedCourseRun.resource_link,
          id: relatedEnrollment.id,
        });
      } else {
        await enrollment.methods.create({
          is_active: true,
          order: order.id,
          course_run: selectedCourseRun.resource_link,
        });
      }
      course.methods.invalidate();
    }
  };

  const formatDate = (date: string) =>
    intl.formatDate(date, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <form ref={formRef} onChange={handleChange}>
      <ol className="course-item__course-run-list">
        {courseRuns.map((courseRun) => (
          <li className="course-run-item form-field" key={`${baseKey}-${courseRun.id}`}>
            <input
              className="form-field__radio-input"
              type="radio"
              id={`${baseKey}|${courseRun.resource_link}`}
              name={baseKey}
            />
            <label className="form-field__label" htmlFor={`${baseKey}|${courseRun.resource_link}`}>
              <span className="form-field__radio-control" />
              <span className="course-run-item__date">{formatDate(courseRun.start)}</span>
              <span className="course-run-item__date">{formatDate(courseRun.end)}</span>
            </label>
          </li>
        ))}
        <li>
          <button
            className="course-run-item__cta button--primary button--pill button--tiny"
            disabled={!selectedCourseRun}
            onClick={handleEnroll}
          >
            {enrollment.states.creating || enrollment.states.updating ? (
              <Spinner />
            ) : (
              <FormattedMessage {...messages.enroll} />
            )}
          </button>
        </li>
      </ol>
    </form>
  );
};

export const EnrolledCourseRun = ({ courseRun }: { courseRun: Joanie.CourseRunEnrollment }) => {
  const intl = useIntl();
  const { methods, states } = useEnrollment();
  const course = useCourse();

  const formatDate = (date: string) =>
    intl.formatDate(date, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const unroll = async () => {
    await methods.update({
      course_run: courseRun.resource_link,
      is_active: false,
      id: courseRun!.id,
    });
    course.methods.invalidate();
  };

  return (
    <ol className="course-item__course-run-list">
      <li className="course-run-item course-run-item--enrolled">
        <span className="course-run-item__date">{formatDate(courseRun.start)}</span>
        <span className="course-run-item__date">{formatDate(courseRun.end)}</span>
      </li>
      <li>
        <a
          href={courseRun.resource_link}
          className="course-run-item__cta button--primary button--pill button--tiny"
        >
          Go to course
        </a>
        <button className="button--tiny" onClick={unroll}>
          {states.updating ? <Spinner /> : 'Unroll'}
        </button>
      </li>
    </ol>
  );
};
