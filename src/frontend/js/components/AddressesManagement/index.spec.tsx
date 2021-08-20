/**
 * Test suite for AddressesManagement component
 */
import React from 'react';
import faker from 'faker';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';
import fetchMock from 'fetch-mock';
import { fireEvent, render, screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import * as Joanie from 'types/Joanie';
import * as mockFactories from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import { SessionProvider } from 'data/SessionProvider';
import validationSchema from './validationSchema';
import AddressesManagement from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

jest.mock('utils/indirection/window', () => ({
  confirm: jest.fn(() => true),
}));

describe('validationSchema', () => {
  // Creation and Update form validation relies on a schema resolves by Yup.
  it('should not have error if values are valid', async () => {
    const defaultValues = {
      address: faker.address.streetAddress(),
      city: faker.address.city(),
      country: faker.address.countryCode(),
      fullname: faker.name.middleName(),
      postcode: faker.address.zipCode(),
      title: faker.random.word(),
      save: false,
    };

    const { result } = renderHook(() =>
      useForm({
        defaultValues,
        resolver: yupResolver(validationSchema),
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    result.current.formState.errors;
    result.current.register('address');
    result.current.register('city');
    result.current.register('country');
    result.current.register('fullname');
    result.current.register('postcode');
    result.current.register('title');
    result.current.register('save');

    await act(async () => {
      result.current.trigger();
    });

    const { formState } = result.current;

    expect(formState.errors.address).not.toBeDefined();
    expect(formState.errors.city).not.toBeDefined();
    expect(formState.errors.country).not.toBeDefined();
    expect(formState.errors.fullname).not.toBeDefined();
    expect(formState.errors.postcode).not.toBeDefined();
    expect(formState.errors.title).not.toBeDefined();
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBeTruthy();
  });

  it('should have an error if values are invalid', async () => {
    const { result } = renderHook(() =>
      useForm({
        resolver: yupResolver(validationSchema),
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    result.current.formState.errors;
    result.current.register('address');
    result.current.register('city');
    result.current.register('country');
    result.current.register('fullname');
    result.current.register('postcode');
    result.current.register('title');
    result.current.register('save');

    // - Trigger form validation with empty values
    await act(async () => {
      result.current.trigger();
    });

    let { formState } = result.current;
    expect(formState.errors.address.type).toEqual('required');
    expect(formState.errors.address.message).toEqual('address is a required field');
    expect(formState.errors.city.type).toEqual('required');
    expect(formState.errors.city.message).toEqual('city is a required field');
    expect(formState.errors.country.type).toEqual('required');
    expect(formState.errors.country.message).toEqual('country is a required field');
    expect(formState.errors.fullname.type).toEqual('required');
    expect(formState.errors.fullname.message).toEqual('fullname is a required field');
    expect(formState.errors.postcode.type).toEqual('required');
    expect(formState.errors.postcode.message).toEqual('postcode is a required field');
    expect(formState.errors.title.type).toEqual('required');
    expect(formState.errors.title.message).toEqual('title is a required field');
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBeFalsy();

    // - Set values for all field but with a wrong one for country field
    await act(async () => {
      result.current.setValue('address', faker.address.streetAddress());
      result.current.setValue('city', faker.address.city());
      // set country value with an invalid country code
      result.current.setValue('country', 'AA');
      result.current.setValue('fullname', faker.name.middleName());
      result.current.setValue('postcode', faker.address.zipCode());
      result.current.setValue('title', faker.random.word());
      result.current.trigger();
    });

    formState = result.current.formState;
    expect(formState.errors.address).not.toBeDefined();
    expect(formState.errors.city).not.toBeDefined();
    expect(formState.errors.country.type).toEqual('oneOf');
    expect(formState.errors.country.message).toContain(
      'country must be one of the following values:',
    );
    expect(formState.errors.fullname).not.toBeDefined();
    expect(formState.errors.postcode).not.toBeDefined();
    expect(formState.errors.title).not.toBeDefined();
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBeFalsy();

    // - Set country value with a valid country code
    await act(async () => {
      result.current.setValue('country', 'FR');
      result.current.trigger();
    });

    formState = result.current.formState;
    expect(formState.errors.address).not.toBeDefined();
    expect(formState.errors.city).not.toBeDefined();
    expect(formState.errors.country).not.toBeDefined();
    expect(formState.errors.fullname).not.toBeDefined();
    expect(formState.errors.postcode).not.toBeDefined();
    expect(formState.errors.title).not.toBeDefined();
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBeTruthy();
  });
});

describe('AddressesManagement', () => {
  const initializeUser = () => {
    const user = mockFactories.FonzieUserFactory.generate();

    sessionStorage.setItem(
      REACT_QUERY_SETTINGS.cacheStorage.key,
      JSON.stringify(
        mockFactories.PersistedClientFactory({
          queries: [mockFactories.QueryStateFactory('user', { data: user })],
        }),
      ),
    );
    sessionStorage.setItem(RICHIE_USER_TOKEN, user.access_token);
  };

  const handleClose = jest.fn();
  const selectAddress = jest.fn();

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
    sessionStorage.clear();
  });

  it('renders a go back button', async () => {
    initializeUser();
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const $closeButton = screen.getByRole('button', { name: 'Go back' });
    expect($closeButton).toBeDefined();

    // - Click on go back button should trigger onClose callback
    expect(handleClose).toHaveBeenCalledTimes(0);
    fireEvent.click($closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders a form to create an address', async () => {
    initializeUser();
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    screen.getByRole('heading', { level: 5, name: 'Add a new address' });
    screen.getByRole('form');
    const $titleField = screen.getByRole('textbox', { name: 'Address title' });
    const $fullnameField = screen.getByRole('textbox', { name: "Recipient's fullname" });
    const $addressField = screen.getByRole('textbox', { name: 'Address' });
    const $cityField = screen.getByRole('textbox', { name: 'City' });
    const $postcodeField = screen.getByRole('textbox', { name: 'Postcode' });
    const $countryField = screen.getByRole('combobox', { name: 'Country' });
    const $saveField = screen.getByRole('checkbox', { name: 'Save this address' });
    const $submitButton = screen.getByRole('button', { name: 'Use this address' });

    // - User fullfills address fields
    let address = mockFactories.AddressFactory.generate();
    expect(selectAddress).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.change($titleField, { target: { value: address.title } });
      fireEvent.change($fullnameField, { target: { value: address.fullname } });
      fireEvent.change($addressField, { target: { value: address.address } });
      fireEvent.change($cityField, { target: { value: address.city } });
      fireEvent.change($postcodeField, { target: { value: address.postcode } });
      fireEvent.change($countryField, { target: { value: address.country } });
      fireEvent.click($submitButton);
    });

    expect(selectAddress).toHaveBeenNthCalledWith(1, {
      ...address,
      id: 'local-billing-address',
      is_main: false,
    });

    // - User fullfills the form again but wants to save the address this time
    address = mockFactories.AddressFactory.generate();
    fetchMock.post('https://joanie.endpoint/api/addresses/', {
      ...address,
      is_main: true,
    });
    await act(async () => {
      fireEvent.change($titleField, { target: { value: address.title } });
      fireEvent.change($fullnameField, { target: { value: address.fullname } });
      fireEvent.change($addressField, { target: { value: address.address } });
      fireEvent.change($cityField, { target: { value: address.city } });
      fireEvent.change($postcodeField, { target: { value: address.postcode } });
      fireEvent.change($countryField, { target: { value: address.country } });
      fireEvent.click($saveField);
      fireEvent.click($submitButton);
    });

    expect(selectAddress).toHaveBeenNthCalledWith(2, {
      ...address,
      is_main: true,
    });
  });

  it("renders the user's addresses", async () => {
    initializeUser();
    const addresses = mockFactories.AddressFactory.generate(Math.ceil(Math.random() * 5));
    fetchMock.get('https://joanie.endpoint/api/addresses/', addresses);

    let container: HTMLElement;

    await act(async () => {
      ({ container } = render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      ));
    });

    // All user's addresses should be displayed
    const $addresses = container!.querySelectorAll('.registered-addresses-item');
    expect($addresses).toHaveLength(addresses.length);

    addresses.forEach((address: Joanie.Address) => {
      expect(screen.queryByRole('heading', { level: 6, name: address.title })).not.toBeNull();
    });

    // - User selects one of its existing address
    const address = addresses[0];
    const $selectButton = screen.getByTitle(`Select "${address.title}" address`, {
      exact: true,
    });
    await act(async () => {
      fireEvent.click($selectButton);
    });
    expect(selectAddress).toHaveBeenNthCalledWith(1, address);
  });

  it('renders an updated form when user selects an adress to edit', async () => {
    initializeUser();
    const address = mockFactories.AddressFactory.generate();
    fetchMock.get('https://joanie.endpoint/api/addresses/', [address]);

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // - First the creation form should be displayed
    screen.getByRole('heading', { level: 5, name: 'Add a new address' });
    screen.getByRole('form');
    screen.getByRole('checkbox', { name: 'Save this address' });
    screen.getByRole('button', { name: 'Use this address' });

    // - Then user selects an address to edit
    let $editButton = screen.getByTitle(`Edit "${address.title}" address`, { exact: true });
    await act(async () => {
      fireEvent.click($editButton);
    });

    // - Form should be updated
    screen.getByRole('heading', { level: 5, name: `Update address ${address.title}` });

    let $titleField = screen.getByRole('textbox', { name: 'Address title' }) as HTMLInputElement;
    let $fullnameField = screen.getByRole('textbox', {
      name: "Recipient's fullname",
    }) as HTMLInputElement;
    let $addressField = screen.queryByRole('textbox', { name: 'Address' }) as HTMLInputElement;
    let $cityField = screen.queryByRole('textbox', { name: 'City' }) as HTMLInputElement;
    let $postcodeField = screen.queryByRole('textbox', { name: 'Postcode' }) as HTMLInputElement;
    let $countryField = screen.queryByRole('combobox', { name: 'Country' }) as HTMLSelectElement;
    let $saveField = screen.queryByRole('checkbox', { name: 'Save this address' });
    let $submitButton = screen.getByRole('button', { name: 'Update this address' });

    expect($titleField.value).toEqual(address.title);
    expect($fullnameField.value).toEqual(address.fullname);
    expect($addressField.value).toEqual(address.address);
    expect($cityField.value).toEqual(address.city);
    expect($postcodeField.value).toEqual(address.postcode);
    expect($countryField.value).toEqual(address.country);
    expect($saveField).toBeNull();

    // - User edits some values then submit its changes
    fetchMock
      .put(`https://joanie.endpoint/api/addresses/${address.id}/`, {
        ...address,
        title: 'Home',
        fullname: 'John DOE',
      })
      .get(
        'https://joanie.endpoint/api/addresses/',
        [
          {
            ...address,
            title: 'Home',
            fullname: 'John DOE',
          },
        ],
        { overwriteRoutes: true },
      );

    await act(async () => {
      fireEvent.change($titleField, 'Home');
      fireEvent.change($fullnameField, 'John DOE');
      fireEvent.click($submitButton);
    });

    // - Form should be restored and addresses should be updated
    screen.getByRole('heading', { level: 5, name: 'Add a new address' });
    screen.getByRole('form');
    screen.getByRole('checkbox', { name: 'Save this address' });
    screen.getByRole('button', { name: 'Use this address' });
    expect(screen.queryByRole('heading', { level: 6, name: 'Home' })).not.toBeNull();

    // User clicks on edit button again
    $editButton = screen.getByTitle(`Edit "Home" address`, { exact: true });
    await act(async () => {
      fireEvent.click($editButton);
    });

    // - Form should be updated
    screen.getByRole('heading', { level: 5, name: `Update address Home` });

    $titleField = screen.getByRole('textbox', { name: 'Address title' }) as HTMLInputElement;
    $fullnameField = screen.getByRole('textbox', {
      name: "Recipient's fullname",
    }) as HTMLInputElement;
    $addressField = screen.queryByRole('textbox', { name: 'Address' }) as HTMLInputElement;
    $cityField = screen.queryByRole('textbox', { name: 'City' }) as HTMLInputElement;
    $postcodeField = screen.queryByRole('textbox', { name: 'Postcode' }) as HTMLInputElement;
    $countryField = screen.queryByRole('combobox', { name: 'Country' }) as HTMLSelectElement;
    $saveField = screen.queryByRole('checkbox', { name: 'Save this address' });
    $submitButton = screen.getByRole('button', { name: 'Update this address' });

    expect($titleField.value).toEqual('Home');
    expect($fullnameField.value).toEqual('John DOE');
    expect($addressField.value).toEqual(address.address);
    expect($cityField.value).toEqual(address.city);
    expect($postcodeField.value).toEqual(address.postcode);
    expect($countryField.value).toEqual(address.country);
    expect($saveField).toBeNull();

    // - But finally it cancels its action
    const $cancelButton = screen.getByTitle('Cancel edition', { exact: true });
    await act(async () => {
      fireEvent.click($cancelButton);
    });

    // - Form should be restored and addresses should be updated
    screen.getByRole('heading', { level: 5, name: 'Add a new address' });
    screen.getByRole('form');
    screen.getByRole('checkbox', { name: 'Save this address' });
    screen.getByRole('button', { name: 'Use this address' });
  });

  it('allows user to delete an existing address', async () => {
    initializeUser();
    const address = mockFactories.AddressFactory.generate();
    fetchMock.get('https://joanie.endpoint/api/addresses/', [address]);

    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      ));
    });

    // - User deletes its only existing address
    fetchMock
      .delete(`https://joanie.endpoint/api/addresses/${address.id}/`, {})
      .get('https://joanie.endpoint/api/addresses/', [], { overwriteRoutes: true });

    const $deleteButton = screen.getByTitle(`Delete "${address.title}" address`, {
      exact: true,
    });

    await act(async () => {
      fireEvent.click($deleteButton);
    });

    // - As this was the only existing address,
    //   registered addresses section should be hidden

    expect(screen.queryByRole('heading', { level: 5, name: 'Your addresses' })).toBeNull();
    const $addresses = container!.querySelectorAll('.registered-addresses-item');
    expect($addresses).toHaveLength(0);
  });

  it('allows user to promote an address as main', async () => {
    initializeUser();
    const [address1, address2] = mockFactories.AddressFactory.generate(2);
    address1.is_main = true;
    fetchMock.get('https://joanie.endpoint/api/addresses/', [address1, address2]);

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <AddressesManagement handleClose={handleClose} selectAddress={selectAddress} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // - User promotes address2 as main
    fetchMock
      .put(`https://joanie.endpoint/api/addresses/${address2.id}/`, {
        ...address2,
        is_main: true,
      })
      .get(
        'https://joanie.endpoint/api/addresses/',
        [
          {
            ...address1,
            is_main: false,
          },
          {
            ...address2,
            is_main: true,
          },
        ],
        {
          overwriteRoutes: true,
        },
      );

    const $promoteButton = screen.getByTitle(`Define "${address2.title}" address as main`, {
      exact: true,
    });

    await act(async () => {
      fireEvent.click($promoteButton);
    });

    const $address1PromoteIndicator = screen.getByTitle(
      `Define "${address1.title}" address as main`,
      {
        exact: true,
      },
    );
    const $address1MainIndicator =
      $address1PromoteIndicator.querySelector('.address-main-indicator')!;
    const $address2PromoteButton = screen.getByTitle(`Define "${address2.title}" address as main`, {
      exact: true,
    });
    const $address2MainIndicator = $address2PromoteButton.querySelector('.address-main-indicator')!;

    expect($address1MainIndicator.classList).not.toContain('address-main-indicator--is-main');
    expect($address2MainIndicator.classList).toContain('address-main-indicator--is-main');
  });
});
