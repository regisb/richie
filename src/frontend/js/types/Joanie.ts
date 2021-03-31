import { Nullable } from 'types/utils';

// - Generic
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  prev: string | null;
  results: Array<T>;
}

interface PaginatedParameters {
  page: number;
  offset: number;
}

export interface QueryParameters extends PaginatedParameters {}

// - Course Run
export interface CourseRun {
  end: string;
  enrollment_end: string;
  enrollment_start: string;
  id: string;
  resource_link: string;
  start: string;
  title: string;
}

export interface CourseRunEnrollment extends CourseRun {
  is_active: boolean;
  state: EnrollmentState;
}

// - Currency
export interface Currency {
  code: string;
  symbol: string;
}

// - Certificate
export interface CertificateDefinition {
  id: number;
  title: string;
  description: string;
}

// - Organization
export interface Organization {
  code: string;
  title: string;
}

// - Product
export enum ProductType {
  CERTIFICATE = 'certificate',
  CREDENTIAL = 'credential',
  ENROLLMENT = 'enrollment',
}

export interface Product {
  id: string;
  title: string;
  type: ProductType;
  price: number;
  call_to_action: string;
  currency: Currency;
  certificate: CertificateDefinition;
  target_courses: Omit<Course, 'products'>[];
}

// - Course
export interface CourseProductTargetCourse {
  code: string;
  organization: Organization;
  title: string;
  course_runs: Array<CourseRun>;
}

export type OrderLite = Pick<
  Order,
  'id' | 'created_on' | 'state' | 'price' | 'enrollments' | 'product'
>;

export interface CourseProduct extends Product {
  order: Nullable<OrderLite>;
  target_courses: CourseProductTargetCourse[];
}

export interface Course {
  code: string;
  organization: Organization;
  title: string;
  products: CourseProduct[];
  course_runs: CourseRun[];
  orders?: OrderLite[];
}
// Enrollment

export enum EnrollmentState {
  FAILED = 'failed',
  SET = 'set',
}

export interface Enrollment extends CourseRun {
  id: string;
  is_active: boolean;
  state: EnrollmentState;
}

export enum OrderState {
  CANCELED = 'canceled',
  FAILED = 'failed',
  FINISHED = 'finished',
  PAID = 'paid',
  PAYMENT_FAILED = 'payment_failed',
  PENDING = 'pending',
}

export interface Order {
  id: string;
  course: string;
  created_on: string;
  enrollments: Enrollment[];
  owner: string;
  price: number;
  state: OrderState;
  product: string;
  target_courses: string[];
}

export interface OrderCreateBody {
  product_id: string;
  resource_link: string[];
}

// Credit Card
export interface CreditCard {
  id: string;
  name: string;
  expiration_date: string;
  last_numbers: string;
  main: boolean;
}

// Address
export interface Address {
  address: string;
  city: string;
  country: string;
  fullname: string;
  id: string;
  is_main: boolean;
  postcode: string;
  title: string;
}

// - API

interface AddressCreationPayload extends Omit<Address, 'id' | 'is_main'> {
  is_main?: boolean;
}

interface OrderCreationPayload {
  product: Product['id'];
  course: Course['code'];
}

interface EnrollmentCreationPayload {
  course_run: Enrollment['resource_link'];
  is_active: boolean;
  order?: Order['id'];
}

interface EnrollmentUpdatePayload extends EnrollmentCreationPayload {
  id: Enrollment['id'];
}

interface APIUser {
  addresses: {
    create(payload: AddressCreationPayload): Promise<Address>;
    delete(id: Address['id']): Promise<void>;
    get(id: Address['id']): Promise<Address>;
    get(): Promise<Address[]>;
    update(payload: Address): Promise<Address>;
  };
  creditCards: {
    create(payload: Omit<CreditCard, 'id'>): Promise<CreditCard>;
    delete(id: CreditCard['id']): Promise<void>;
    get(id: CreditCard['id']): Promise<CreditCard>;
    get(): Promise<CreditCard[]>;
    update(payload: CreditCard): Promise<CreditCard>;
  };
  orders: {
    create(payload: OrderCreationPayload): Promise<Order>;
    get(id: Order['id']): Promise<Order>;
    get(queryParameters?: QueryParameters): Promise<PaginatedResponse<Order>>;
  };
  certificates: {};
  enrollments: {
    create(payload: EnrollmentCreationPayload): Promise<any>;
    get(id: Enrollment['id']): Promise<Enrollment>;
    get(queryParameters?: QueryParameters): Promise<PaginatedResponse<Enrollment>>;
    update(payload: EnrollmentUpdatePayload): Promise<any>;
  };
}

export interface API {
  user: APIUser;
  courses: {
    get(id: string): Promise<Course>;
  };
  courseRuns: {};
}

export interface Backend {
  endpoint: string;
}
