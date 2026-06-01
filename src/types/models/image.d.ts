interface ImageInfo {
  id: string
  tags: string[]
  created?: number
  size?: number
  architecture?: string
  os?: string
  layers?: number
}

interface ImagePullRequest {
  image: string
}
