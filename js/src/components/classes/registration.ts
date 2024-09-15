export type RegistrationsList = {
  eventName: string
  head: Array<{
    label: string
    deleted: boolean
  }>
  body: string[][]
  total: number
  totalParticipants: number
}