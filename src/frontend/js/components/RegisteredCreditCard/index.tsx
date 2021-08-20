import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import * as Joanie from 'types/Joanie';

const messages = defineMessages({
  inputAriaLabel: {
    defaultMessage: "Select {name}'s card",
    description: 'ARIA Label read by screenreader to inform which card is focused',
    id: 'components.RegisteredCreditCard.inputAriaLabel',
  },
  expirationDate: {
    defaultMessage: 'Expiration date: {expirationDate}',
    description: 'Credit card expiration date label',
    id: 'components.RegisteredCreditCard.expirationDate',
  },
});

interface RegisteredCreditCardProps extends Joanie.CreditCard {
  selected: boolean;
  handleSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RegisteredCreditCard = ({
  selected,
  handleSelect,
  ...creditCard
}: RegisteredCreditCardProps) => {
  const intl = useIntl();

  return (
    <label className="RegisteredCreditCard">
      <p className="form-field">
        <input
          aria-label={intl.formatMessage(messages.inputAriaLabel, {
            name: creditCard.name,
          })}
          checked={selected}
          className="form-field__checkbox-input"
          onChange={handleSelect}
          type="checkbox"
          id={`registerd-credit-card-${creditCard.id}`}
        />
        <label htmlFor={`registerd-credit-card-${creditCard.id}`} className="form-field__label">
          <span className="form-field__checkbox-control">
            <svg role="img" aria-hidden="true">
              <use href="#icon-check" />
            </svg>
          </span>
        </label>
      </p>
      <div className="RegisteredCreditCard__infos">
        <h6 className="RegisteredCreditCard__name">{creditCard.name}</h6>
        <p className="RegisteredCreditCard__number">{creditCard.last_numbers}</p>
        <p className="RegisterdCreditCard__validity">
          <FormattedMessage
            {...messages.expirationDate}
            values={{ expirationDate: creditCard.expiration_date }}
          />
        </p>
      </div>
    </label>
  );
};
