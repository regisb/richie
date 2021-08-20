import React, { Fragment, useMemo, useState } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import { useSession } from 'data/SessionProvider';
import { Maybe, Nullable } from 'types/utils';
import { User } from 'types/User';
import * as Joanie from 'types/Joanie';
import { useAddresses } from 'hooks/useAddresses';
import { useCreditCards } from 'hooks/useCreditCards';
import { useOrders } from 'hooks/useOrders';
import { handle } from 'utils/errors/handle';
import { Spinner } from 'components/Spinner';
import { RegisteredCreditCard } from 'components/RegisteredCreditCard';
import { useCourse } from 'data/CourseProductsProvider';
import AddressesManagement, { LOCAL_BILLING_ADDRESS_ID } from '../AddressesManagement';
import { TextField, SelectField } from '../Form';

const messages = defineMessages({
  pay: {
    defaultMessage: 'Pay {price}',
    description: 'CTA label to proceed of the product',
    id: 'components.SaleTunnelStepPayment.pay',
  },
  resumeTile: {
    defaultMessage: 'You are about to purchase',
    description: 'Label for the resume tile',
    id: 'components.SaleTunnelStepPayment.resumeTile',
  },
  userTile: {
    defaultMessage: 'Your personal information',
    description: 'Label for the user information tile',
    id: 'components.SaleTunnelStepPayment.userTile',
  },
  userInvoiceAddressFieldset: {
    defaultMessage: 'Billing address',
    description: 'Label for the invoice address fieldset',
    id: 'components.SaleTunnelStepPayment.userInvoiceAddressFieldset',
  },
  userInvoiceAddressSelectLabel: {
    defaultMessage: 'Select an invoice address',
    description: 'Label for the invoice address select',
    id: 'components.SaleTunnelStepPayment.userInvoiceAddressSelectLabel',
  },
  registeredCardTile: {
    defaultMessage: 'Your personal information',
    description: 'Label for the registered credit cards tile',
    id: 'components.SaleTunnelStepPayment.registeredCardTile',
  },
  or: {
    defaultMessage: 'or',
    description: 'Label which separates registered credit card and payment form tiles',
    id: 'components.SaleTunnelStepPayment.or',
  },
  paymentFormTile: {
    defaultMessage: 'Use another credit card',
    description: 'Label for the payment form tile',
    id: 'components.SaleTunnelStepPayment.paymentFormTile',
  },
  paymentFormOwnerInput: {
    defaultMessage: 'Cardholder',
    description: 'Label for the owner input',
    id: 'components.SaleTunnelStepPayment.paymentFormOwnerInput',
  },
  paymentFormCardNumberInput: {
    defaultMessage: 'Card number',
    description: 'Label for the card number input',
    id: 'components.SaleTunnelStepPayment.paymentFormCardNumberInput',
  },
  paymentFormExpirationDateInput: {
    defaultMessage: 'Expiration date (MM/YY)',
    description: 'Label for the expiration date input',
    id: 'components.SaleTunnelStepPayment.paymentFormExpirationDateInput',
  },
  paymentFormCryptogramInput: {
    defaultMessage: 'Cryptogram',
    description: 'Label for the cryptogram input',
    id: 'components.SaleTunnelStepPayment.paymentFormCryptogramInput',
  },
  paymentFormSaveCreditCardInput: {
    defaultMessage: 'Save this card',
    description: 'Label for the save card checkbox',
    id: 'components.SaleTunnelStepPayment.paymentFormSaveCreditCardInput',
  },
});

interface SaleTunnelStepPaymentProps {
  product: Joanie.Product;
  next: () => void;
}

export const SaleTunnelStepPayment = ({ product, next }: SaleTunnelStepPaymentProps) => {
  /**
   * Sort addresses ascending by title according to the locale
   *
   * @param {Joanie.Address} a
   * @param {Joanie.Address} b
   * @returns {Joanie.Address[]} Sorted addresses ascending by title
   */
  const sortAddressByTitleAsc = (a: Joanie.Address, b: Joanie.Address) => {
    return a.title.localeCompare(b.title, [intl.locale, intl.defaultLocale]);
  };

  const intl = useIntl();
  const course = useCourse();
  const { user } = useSession() as { user: User };
  const addresses = useAddresses();
  const creditCards = useCreditCards();
  const orders = useOrders();
  const [showAddressCreationForm, setShowAddressCreationForm] = useState(false);

  const [creditCard, setCreditCard] = useState<Nullable<string>>(
    creditCards.items.find((c) => c.main)?.id || null,
  );
  const [selectedAddress, setSelectedAddress] = useState<Maybe<Joanie.Address>>(
    addresses.items.find((a) => a.is_main) || addresses.items.sort(sortAddressByTitleAsc)[0],
  );

  /**
   * Memoized address items.
   * If the selected address is a local one, we have to add it to the item list.
   * Finally we sort address ascending by title before return them
   *
   * @returns {Joanie.Address[]} Sorted addresses ascending by title
   */
  const addressesItems = useMemo(() => {
    const items = [...addresses.items];

    // Add local address to the address item list.
    if (selectedAddress?.id === LOCAL_BILLING_ADDRESS_ID) {
      items.push(selectedAddress);
    }

    return items.sort(sortAddressByTitleAsc);
  }, [addresses.items, selectedAddress]);

  /**
   * Retrieve address through its `id` provided by the event target value
   * then update `selectedAddress` state
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} event
   */
  const handleSelectAddress = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const address = addresses.items.find((a) => a.id === event.target.value);
    if (address) {
      setSelectedAddress(address);
    }
  };

  const toggleCreditCard = (creditCardId: string) => {
    if (creditCard === creditCardId) {
      setCreditCard(null);
    } else {
      setCreditCard(creditCardId);
    }
  };

  const formatCardNumber = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (value.replaceAll(' ', '').length % 4 === 0) {
      event.target.value = value + ' ';
    }
  };

  const processOrder = async () => {
    try {
      await orders.methods.create(
        { course: course.item!.code, product: product.id },
        { onSuccess: next },
      );
      next();
    } catch (error) {
      handle(error);
    }
  };

  if (showAddressCreationForm) {
    return (
      <AddressesManagement
        handleClose={() => setShowAddressCreationForm(false)}
        selectAddress={setSelectedAddress}
      />
    );
  }

  return (
    <section className="SaleTunnelStepPayment">
      <div className="SaleTunnelStepPayment__row">
        <section className="SaleTunnelStepPayment__block">
          <header className="SaleTunnelStepPayment__block__header">
            <h5 className="SaleTunnelStepPayment__block__title">
              <FormattedMessage {...messages.resumeTile} />
            </h5>
          </header>
          <div className="SaleTunnelStepPayment__block--product">
            <h6 className="SaleTunnelStepPayment__block--product__title">{product.title}</h6>
            <p className="SaleTunnelStepPayment__block--product__price">
              <FormattedNumber
                value={product.price}
                style="currency"
                currency={product.currency.code}
              />
            </p>
          </div>
        </section>
        <span className="SaleTunnelStepPayment__block--separator" />
        <section className="SaleTunnelStepPayment__block">
          <header className="SaleTunnelStepPayment__block__header">
            <h5 className="SaleTunnelStepPayment__block__title">
              <FormattedMessage {...messages.userTile} />
            </h5>
          </header>
          <div className="SaleTunnelStepPayment__block--buyer">
            <h6 className="SaleTunnelStepPayment__block--buyer__name">
              {user.fullname || user.username}
            </h6>
            {user.email ? (
              <p className="SaleTunnelStepPayment__block--buyer__email">{user.email}</p>
            ) : null}
            <header className="SaleTunnelStepPayment__block--buyer__address-header">
              <h6>
                <FormattedMessage {...messages.userInvoiceAddressFieldset} />
              </h6>
              {addressesItems.length > 0 && (
                <button
                  aria-hidden="true"
                  className="button button--tiny button--pill button--outline-purplish-grey"
                  onClick={() => setShowAddressCreationForm(true)}
                >
                  <svg className="button__icon" role="img">
                    <use href="#icon-plus" />
                  </svg>
                  Add an address
                </button>
              )}
            </header>
            {addressesItems.length > 0 ? (
              <Fragment>
                <SelectField
                  fieldClasses={['form-field--minimal']}
                  id="invoice_address"
                  name="invoice_address"
                  label={intl.formatMessage(messages.userInvoiceAddressSelectLabel)}
                  onChange={handleSelectAddress}
                  defaultValue={selectedAddress!.id || ''}
                  options={addressesItems.map((address) => ({
                    key: `address-${address.id}`,
                    value: address.id,
                    label: address.title,
                  }))}
                />
                <address className="SaleTunnelStepPayment__block--buyer__address">
                  {selectedAddress!.fullname}
                  <br />
                  {selectedAddress!.address}
                  <br />
                  {selectedAddress!.postcode} {selectedAddress!.city}, {selectedAddress!.country}
                </address>
              </Fragment>
            ) : (
              <Fragment>
                <p className="SaleTunnelStepPayment__block--buyer__address__noAddress">
                  <em>You have not yet a billing address.</em>
                </p>
                <button
                  aria-hidden="true"
                  className="button button--tiny button--pill button--primary"
                  onClick={() => setShowAddressCreationForm(true)}
                >
                  <svg className="button__icon" role="img">
                    <use href="#icon-plus" />
                  </svg>
                  Create an address
                </button>
              </Fragment>
            )}
          </div>
        </section>
      </div>
      <div className="SaleTunnelStepPayment__row">
        {creditCards.items?.length > 0 ? (
          <React.Fragment>
            <section className="SaleTunnelStepPayment__block">
              <header className="SaleTunnelStepPayment__block__header">
                <h5 className="SaleTunnelStepPayment__block__title">
                  <FormattedMessage {...messages.registeredCardTile} />
                </h5>
              </header>
              <ul className="SaleTunnelStepPayment__block--registered-credit-card-list">
                {creditCards.items.map((card) => (
                  <li key={`credit-card-${card.id}`}>
                    <RegisteredCreditCard
                      selected={creditCard === card.id}
                      handleSelect={() => toggleCreditCard(card.id)}
                      {...card}
                    />
                  </li>
                ))}
              </ul>
            </section>
            <section className="SaleTunnelStepPayment__block SaleTunnelStepPayment__block--separator">
              <FormattedMessage {...messages.or} />
            </section>
          </React.Fragment>
        ) : null}
        <section className="SaleTunnelStepPayment__block">
          <header className="SaleTunnelStepPayment__block__header">
            <h5 className="SaleTunnelStepPayment__block__title">
              <FormattedMessage {...messages.paymentFormTile} />
            </h5>
          </header>
          <form className="SaleTunnelStepPayment__block--credit-card-form">
            <TextField
              fieldClasses={['form-field--align-right']}
              label="Titulaire de la carte"
              id="owner"
              name="owner"
            />
            <p className="form-field form-field--align-right">
              <input
                className="form-field__input"
                aria-label="Titulaire de la carte"
                aria-required="true"
                type="text"
                id="owner"
                name="owner"
                placeholder=""
                required
              />
              <label className="form-field__label" htmlFor="owner">
                <FormattedMessage {...messages.paymentFormOwnerInput} />
              </label>
            </p>
            <p className="form-field form-field--align-right">
              <input
                className="form-field__input"
                aria-label="Numéro de la carte"
                aria-required="true"
                type="text"
                id="number"
                name="number"
                placeholder=""
                maxLength={20}
                onChange={formatCardNumber}
                required
              />
              <label className="form-field__label" htmlFor="number">
                <FormattedMessage {...messages.paymentFormCardNumberInput} />
              </label>
            </p>
            <div className="form-group">
              <p className="form-field form-field--align-right" style={{ flex: 2 }}>
                <input
                  className="form-field__input"
                  aria-label="Date d'expiration de la carte"
                  aria-required="true"
                  type="text"
                  id="expiration_date"
                  name="expiration_date"
                  placeholder=""
                  maxLength={5}
                  pattern="/\d{2}\/\d{2}/"
                  required
                />
                <label className="form-field__label" htmlFor="expiration_date">
                  <FormattedMessage {...messages.paymentFormExpirationDateInput} />
                </label>
              </p>
              <p className="form-field form-field--align-right" style={{ flex: 1 }}>
                <input
                  className="form-field__input"
                  aria-label="Cryptogramme de la carte"
                  aria-required="true"
                  aria-placeholder="CCV"
                  type="text"
                  maxLength={3}
                  id="cryptogram"
                  name="cryptogram"
                  placeholder=""
                  required
                />
                <label className="form-field__label" htmlFor="cryptogram">
                  <FormattedMessage {...messages.paymentFormCryptogramInput} />
                </label>
              </p>
            </div>
            <p className="form-field">
              <input
                className="form-field__checkbox-input"
                aria-label="Se souvenir de cette carte"
                aria-required="false"
                type="checkbox"
                id="save"
                name="save"
              />
              <label className="form-field__label" htmlFor="save">
                <span className="form-field__checkbox-control" aria-hidden={true}>
                  <svg role="img">
                    <use href="#icon-check" />
                  </svg>
                </span>
                <FormattedMessage {...messages.paymentFormSaveCreditCardInput} />
              </label>
            </p>
          </form>
        </section>
      </div>
      <footer className="SaleTunnelStepPayment__footer">
        <button
          className="button button--primary"
          disabled={orders.states.creating}
          onClick={processOrder}
        >
          {orders.states.creating ? (
            <Spinner />
          ) : (
            <React.Fragment>
              <FormattedMessage
                {...messages.pay}
                values={{
                  price: intl.formatNumber(product.price, {
                    style: 'currency',
                    currency: product.currency.code,
                  }),
                }}
              />
            </React.Fragment>
          )}
        </button>
      </footer>
    </section>
  );
};
