type LoadingComponent = {
    loading: boolean
    setLoading: (value: boolean) => void
}

export type FormProps = LoadingComponent & {
    eventId: number
    disabled: boolean
    admin: boolean
}

export type EditFormFieldsProps = {
    formFields: Field[]
    setFormFields: (value: Field[]) => void
}

export type BaseFieldProps = {
    label: string
    disabled: boolean
    required: boolean
}

export type TextFieldProps = BaseFieldProps & {
    value: string
    type: 'text' | 'email'
    setValue: (value: string) => void
}

export type RadioFieldProps = BaseFieldProps & {
    value: string
    setValue: (value: string) => void
    options: string[]
}

export type EditFieldProps<T extends Field> = {
    field: T,
    setField: (f: T) => void
}

export type EditRadioFieldProps = EditFieldProps<RadioField> & {
}

export type EditTextFieldProps = EditFieldProps<Field> & {
    fieldType: 'text' | 'email'
}

export type EditFieldModalProps = {
    showEditFieldModal: boolean
    setShowEditFieldModal: (value: boolean) => void
    fieldToEdit: Field | null
    setFieldToEdit: (field: Field) => void
    saveField: (field: Field) => void
}
