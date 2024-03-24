type LoadingComponent = {
    loading: boolean
    setLoading: (value: boolean) => void
}

export type FormProps = LoadingComponent & {
    eventId: number
    disabled: boolean
    admin: boolean
}

export type TextFieldProps = {
    label: string
    value: string,
    type: 'text' | 'email'
    setValue: (value: string) => void
    disabled?: boolean
    validator?: (value: string) => boolean
}

export type EditFieldProps<T extends Field> = {
    field: T,
    setField: (f: T) => void
}

export type EditRadioFieldProps = EditFieldProps<RadioField> & {
}

export type EditTextFieldProps = EditFieldProps<Field> & {
    fieldType: FieldType
}

export type AddFieldModalProps = {
    showAddFieldModal: boolean
    setShowAddFieldModal: (value: boolean) => void
    saveCurrentField: <T extends Field>(field: T) => void
}
