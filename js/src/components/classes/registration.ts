export type Registration = {
  id: number | null
  values: Record<number, string>
  waitingList: boolean
}

export type RegistrationsList = {
  eventName: string
  head: Array<{
    label: string
    deleted: boolean
  }>
  body: string[][]
  total: number
  totalParticipants: number
  totalWaiting: number
}