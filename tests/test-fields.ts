export const TEST_FIELDS = [
  {
    label: 'text-field-1',
    fieldType: 'text',
    required: true,
    description: 'text-field-description-1'
  },
  {
    label: 'text-field-2',
    fieldType: 'text',
    required: false
  },
  {
    label: 'email-field-1',
    fieldType: 'email',
    required: true,
    description: 'email-field-description-1',
    extra: { confirmationAddress: true }
  },
  {
    label: 'email-field-2',
    fieldType: 'email',
    required: false,
    extra: { confirmationAddress: false }
  },
  {
    label: 'radio-field-1',
    fieldType: 'radio',
    required: true,
    description: 'radio-field-description-1',
    extra: { options: ['op1-1', 'op1-2', 'op1-3'] }
  },
  {
    label: 'radio-field-2',
    fieldType: 'radio',
    required: false,
    extra: { options: ['op2-1', 'op2-2'] }
  },
  {
    label: 'checkbox-field-1',
    fieldType: 'checkbox',
    required: false
  },
  {
    label: 'checkbox-field-2',
    fieldType: 'checkbox',
    required: false
  },
  {
    label: 'dropdown-field-1',
    fieldType: 'dropdown',
    required: true,
    description: 'dropdown-field-description-1',
    extra: { options: ['op1-1', 'op1-2', 'op1-3'], multiple: true }
  },
  {
    label: 'dropdown-field-2',
    fieldType: 'dropdown',
    required: true,
    extra: { options: ['op2-1', 'op2-2'], multiple: false }
  },
  {
    label: 'privacy',
    fieldType: 'privacy',
    required: true
  }
];
