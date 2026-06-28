// ─── Runtime image ( /api/images , 对标 docker images ) ───

interface ImageInfo {
  id: string
  tags: string[]
  created?: number
  size?: number
  architecture?: string
  os?: string
  layers?: number
  taskId?: string
}

interface ImagePullRequest {
  image: string
}

interface ImageTagRequest {
  tag: string
}

interface ImageHistoryLayer {
  id: string
  created: number
  createdBy: string
  size: number
  comment: string
}

interface ImageSearchResult {
  name: string
  description: string
  stars: number
  isOfficial: boolean
}

interface ImageBuildRequest {
  dockerfile: string
  tag: string
  context?: Record<string, string>
}

interface ImagePullResult {
  id: string
  tags: string[]
  size?: number
}
