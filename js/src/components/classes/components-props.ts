type LoadingComponent = {
    loading: boolean
    setLoading: (value: boolean) => void
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