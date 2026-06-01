interface ContainerImage {
  id: string
  repo: string
  tag: string
  size: number
  created: number
}

interface ImagePullRequest {
  image: string
}
