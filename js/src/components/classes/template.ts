import { Field } from "./fields";

export type TemplateConfiguration = {

  id: number | null
  name: string,
  formFields: Field[],
  autoremove: boolean,
  autoremovePeriod: number
  waitingList: boolean
  adminEmail: string | null
  editableRegistrations: boolean
  extraEmailContent: string
};