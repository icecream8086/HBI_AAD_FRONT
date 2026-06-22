type Platform = 'alibaba' | 'aws' | 'podman' | 'stub'

type RegionBucketType = 'aws-s3' | 'alibaba-oss' | 'cloudflare-r2' | 'minio'

// ─── ComputeInstance ───

interface InstanceCapabilities {
  container?: boolean
  image?: boolean
  group?: boolean
  metrics?: boolean
  dns?: boolean
  network?: boolean
  s3?: boolean
}

interface InstanceCapacity {
  cpu?: number
  memory?: number
  maxPodCount?: number
}

type InstanceStatus = 'online' | 'offline' | 'error'

interface ComputeInstance {
  id: string
  name: string
  platform: Platform
  region: string
  zone: string
  endpoint: string
  credentialRef?: string
  capabilities: InstanceCapabilities
  capacity?: InstanceCapacity
  status: InstanceStatus
  instanceTypes?: string[]
  networkDomain?: string
  faultDomain?: string
  labels?: Record<string, string>
  createdAt: number
  updatedAt: number
}

interface CreateInstanceInput {
  name: string
  platform: Platform
  region: string
  zone?: string
  endpoint: string
  credentialRef?: string
  capabilities?: InstanceCapabilities
  capacity?: InstanceCapacity
  instanceTypes?: string[]
  networkDomain?: string
  faultDomain?: string
  labels?: Record<string, string>
}

interface UpdateInstanceInput {
  name?: string
  endpoint?: string
  credentialRef?: string | null
  capabilities?: InstanceCapabilities
  capacity?: InstanceCapacity | null
  status?: InstanceStatus
  instanceTypes?: string[] | null
  networkDomain?: string | null
  faultDomain?: string | null
  labels?: Record<string, string> | null
}

interface HeartbeatBody {
  capacity: InstanceCapacity
  status?: InstanceStatus
}

// ─── RegionBucket ───

interface RegionBucket {
  id: string
  name: string
  bucketType: RegionBucketType
  instanceId: string
  credentialRef?: string
  status: 'Active' | 'Inactive'
  autoGenerateKeys?: boolean
  createdAt: number
  updatedAt: number
}

interface CreateBucketInput {
  name: string
  bucketType: RegionBucketType
  instanceId: string
  credentialRef?: string
  autoGenerateKeys?: boolean
}

interface UpdateBucketInput {
  name?: string
  bucketType?: RegionBucketType
  instanceId?: string
  credentialRef?: string | null
  status?: 'Active' | 'Inactive'
  autoGenerateKeys?: boolean
}

// ─── Credential ───

type CredentialType = 'aksk' | 'token' | 'password'

interface RegistryCredential {
  server: string
  userName: string
  password: string
}

interface MaskedCredential {
  id: string
  name: string
  type: CredentialType
  platform: Platform
  accessKeyId?: string
  accessKeySecret?: string   // masked by backend
  token?: string             // masked by backend
  username?: string
  password?: string           // masked by backend
  registryCredentials?: RegistryCredential[]
  instanceId?: string
  status: 'active' | 'inactive'
  createdAt: number
  updatedAt: number
}

interface CreateCredentialInput {
  name: string
  type: CredentialType
  platform: Platform
  accessKeyId?: string
  accessKeySecret?: string
  token?: string
  username?: string
  password?: string
  registryCredentials?: RegistryCredential[]
  instanceId?: string
}

interface UpdateCredentialInput {
  name?: string
  type?: CredentialType
  accessKeyId?: string
  accessKeySecret?: string
  token?: string
  username?: string
  password?: string
  registryCredentials?: RegistryCredential[] | null
  instanceId?: string | null
  status?: 'active' | 'inactive'
}

interface PlatformRegion {
  regionId: string
}

// ─── ImageRepository ───

type ImageStatus = 'pending' | 'pulling' | 'ready' | 'error'

interface ImageRepository {
  id: string
  name: string
  instanceId: string
  image: string
  credentialRef?: string
  registryCredential?: RegistryCredential
  status: ImageStatus
  message?: string
  createdAt: number
  updatedAt: number
}

interface CreateImageInput {
  name: string
  instanceId: string
  image: string
  credentialRef?: string
  registryCredential?: RegistryCredential
}

// ─── PullTask ───

type PullTaskStatus = 'pulling' | 'completed' | 'failed'

interface PullTask {
  id: string
  imageId: string
  status: PullTaskStatus
  result?: { id: string; tags: string[] }
  error?: string
  createdAt: number
  updatedAt: number
}

// ─── BandwidthConfig ───

interface BandwidthConfig {
  egress?: number
  ingress?: number
  burst?: number
  priority?: number
}

// ─── Extension Fields (平台扩展字段) ───

interface ExtensionField {
  key: string
  type: 'boolean' | 'number' | 'string' | 'string[]'
  label: string
  description?: string
  default?: unknown
  validation?: Record<string, unknown>
  category: string
}

interface ExtensionFieldGroup {
  provider: string
  label: string
  instanceId: string
  instanceName: string
  fields: ExtensionField[]
}

// ─── SecurityGroup (原 VirtualNetwork, 无 CIDR) ───

interface SecurityGroup {
  id: string
  name: string
  description?: string
  securityGroupId?: string
  rules?: NetworkRule[]
  instanceId: string
  provider: string
  region: string
  visibility: 'public' | 'private'
  bandwidth?: BandwidthConfig
  status: string
  createdAt: number
  updatedAt: number
}

interface CreateSecurityGroupInput {
  name: string
  description?: string
  securityGroupId?: string
  rules?: NetworkRule[]
  instanceId: string
  visibility?: 'public' | 'private'
  bandwidth?: BandwidthConfig
  userGroupIds?: string[]
}

interface UpdateSecurityGroupInput {
  name?: string
  description?: string | null
  securityGroupId?: string | null
  rules?: NetworkRule[] | null
  visibility?: 'public' | 'private'
  bandwidth?: BandwidthConfig
  userGroupIds?: string[] | null
  status?: string
}

// ─── Subnet ───

interface Subnet {
  id: string
  name: string
  description?: string
  cidr: string
  subnetPrefix: number
  instanceId: string
  provider: string
  region: string
  visibility: 'public' | 'private'
  status: string
  createdAt: number
  updatedAt: number
}

interface CreateSubnetInput {
  name: string
  description?: string
  cidr: string
  subnetPrefix: number
  instanceId: string
  visibility?: 'public' | 'private'
  userGroupIds?: string[]
}

interface UpdateSubnetInput {
  name?: string
  description?: string | null
  cidr?: string
  subnetPrefix?: number
  visibility?: 'public' | 'private'
  userGroupIds?: string[] | null
  status?: string
}

// ─── Volume ───

type VolumeType = 'NFSVolume' | 'HostPathVolume' | 'EmptyDirVolume' | 'DiskVolume' | 'SecretVolume'

interface NFSConfig {
  server: string
  path: string
  readOnly?: boolean
}

interface DiskConfig {
  diskId: string
  fsType: string
  sizeGiB?: number
  diskCategory?: 'cloud_efficiency' | 'cloud_ssd' | 'cloud_essd'
  readOnly?: boolean
  deleteWithInstance?: boolean
}

interface ConfigMapItem {
  key: string
  path: string
  mode?: number
}

interface SecretConfig {
  name: string
  items?: ConfigMapItem[]
}

interface Volume {
  id: string
  name: string
  description?: string
  instanceId: string
  type: VolumeType
  credentialRef?: string
  nfs?: NFSConfig
  disk?: DiskConfig
  secret?: SecretConfig
  status: string
  createdAt: number
  updatedAt: number
}

interface CreateVolumeInput {
  name: string
  description?: string
  instanceId: string
  type: VolumeType
  credentialRef?: string
  nfs?: NFSConfig
  disk?: DiskConfig
  secret?: SecretConfig
}

interface UpdateVolumeInput {
  name?: string
  description?: string | null
  nfs?: NFSConfig
  disk?: DiskConfig
  secret?: SecretConfig
}

// ─── S3 Bucket Policy ───
interface S3Policy {
  id: string
  name: string
  effect: 'Allow' | 'Deny'
  actions: string[]
  pathPrefix?: string
  bucketId: string
  createdAt: number
  updatedAt: number
}

interface NetworkRule {
  direction: 'ingress' | 'egress'
  protocol?: string
  port?: string
  cidr?: string
  action?: 'allow' | 'deny'
  rateLimit?: number
}
