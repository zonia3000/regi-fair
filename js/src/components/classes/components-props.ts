import { Field, RadioField } from "./fields"

type LoadingComponent = {
    loading: boolean
    setLoading: (value: boolean) => void
}

export type FormProps = LoadingComponent & {
    eventId: number
    disabled: boolean
    admin: boolean
}

export type FormFieldsProps = {
    formFields: Field[]
    fieldsValues: Record<number, string>
    setFieldsValues: (values: Record<number, string>) => void
    fieldsErrors: Record<number, string>
    disabled: boolean
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

export type InputFieldProps = BaseFieldProps & {
    value: string
    type: 'text' | 'email' | 'number'
    min?: number
    max?: number
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

export type EditInputFieldProps = EditFieldProps<Field> & ({
    fieldType: 'text' | 'email'
} | {
    fieldType: 'number'
    useAsNumberOfPeople: boolean
})

export type EditFieldModalProps = {
    showEditFieldModal: boolean
    allowNumberOfPeopleField: boolean
    setShowEditFieldModal: (value: boolean) => void
    fieldToEdit: Field | null
    setFieldToEdit: (field: Field) => void
    saveField: (field: Field) => void
}
