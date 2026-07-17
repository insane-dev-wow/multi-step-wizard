export interface RequestItem {
  id?: string
  serviceName: string
  description: string
  quantity: number
}

export interface WizardFormValues {
  userInfo: {
    name: string
    phone: string
    email: string
  }
  requestItems: RequestItem[]
}
