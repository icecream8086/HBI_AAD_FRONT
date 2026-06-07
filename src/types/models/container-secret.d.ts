interface ContainerSecret {
  id: string
  name: string
  type: 'value' | 'upload'
  value?: string
  createdAt: number
  updatedAt: number
}

interface CreateContainerSecretRequest {
  name: string
  type: 'value' | 'upload'
  value?: string
}
