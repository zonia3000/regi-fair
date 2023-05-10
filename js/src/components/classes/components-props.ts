import TextField from "../fields/TextField"

type LoadingComponent = {
    loading: boolean
    setLoading: (value: boolean) => void
}

export type EditEventProps = LoadingComponent & {
    currentEventId: number | null
    toggleEditing: () => void
}

export type FormProps = LoadingComponent & {
    eventId: number
    disabled: boolean
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

export type ListEventsProps = LoadingComponent & {
    selectEvent: (id: number) => void
}