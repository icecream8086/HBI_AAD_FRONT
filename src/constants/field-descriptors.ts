/**
 * Centralized field descriptors for entity types.
 *
 * Each ColumnPreset's `prop` values are compile-time verified against the entity type.
 * Renaming a field in a .d.ts file produces a TS error here, forcing the columns to be updated.
 */

import type { ColumnPreset } from '../utils/field-descriptor'

// ─── Topology entities ───

export const instanceColumns = [
  { prop: 'name', label: 'table.name', minWidth: 140 },
  { prop: 'platform', label: 'topology.platform', width: 90 },
  { prop: 'region', label: 'topology.region', width: 110 },
  { prop: 'zone', label: 'topology.zone', width: 110 },
  { prop: 'endpoint', label: 'topology.endpoint', minWidth: 200, showOverflowTooltip: true },
  { prop: 'status', label: 'table.status', width: 90, statusMap: { online: 'success', offline: 'info', error: 'danger' } },
  { prop: 'createdAt', label: 'table.createdAt', width: 150, fmt: 'datetime' },
] as const satisfies ColumnPreset<ComputeInstance>

export const credentialColumns = [
  { prop: 'name', label: 'table.name', minWidth: 140 },
  { prop: 'platform', label: 'topology.platform', width: 90 },
  { prop: 'type', label: 'topology.credentialType', width: 100 },
  { prop: 'status', label: 'table.status', width: 90, statusMap: { active: 'success', inactive: 'info' } },
  { prop: 'createdAt', label: 'table.createdAt', width: 150, fmt: 'datetime' },
] as const satisfies ColumnPreset<MaskedCredential>

export const volumeColumns = [
  { prop: 'name', label: 'table.name', minWidth: 140 },
  { prop: 'type', label: 'topology.volumeType', width: 130 },
  { prop: 'instanceId', label: 'topology.instanceTitle', width: 140, fmt: 'truncate' },
  { prop: 'status', label: 'table.status', width: 90 },
  { prop: 'createdAt', label: 'table.createdAt', width: 150, fmt: 'datetime' },
] as const satisfies ColumnPreset<Volume>

export const bucketColumns = [
  { prop: 'name', label: 'table.name', minWidth: 140 },
  { prop: 'bucketType', label: 'topology.bucketType', width: 110 },
  { prop: 'instanceId', label: 'topology.instanceTitle', width: 140, fmt: 'truncate' },
  { prop: 'credentialRef', label: 'topology.credentialRef', width: 130 },
  { prop: 'status', label: 'table.status', width: 90, statusMap: { Active: 'success', Inactive: 'info' } },
  { prop: 'createdAt', label: 'table.createdAt', width: 150, fmt: 'datetime' },
] as const satisfies ColumnPreset<RegionBucket>

export const imageColumns = [
  { prop: 'name', label: 'table.name', minWidth: 140 },
  { prop: 'image', label: 'image.imageCol', minWidth: 240, showOverflowTooltip: true },
  { prop: 'status', label: 'table.status', width: 100, statusMap: { pending: 'primary', pulling: 'warning', ready: 'success', error: 'danger' } },
  { prop: 'createdAt', label: 'table.createdAt', width: 150, fmt: 'datetime' },
] as const satisfies ColumnPreset<ImageRepository>

export const securityGroupColumns = [
  { prop: 'name', label: 'table.name', minWidth: 140 },
  { prop: 'securityGroupId', label: 'network.securityGroupId', minWidth: 180, showOverflowTooltip: true },
  { prop: 'visibility', label: 'network.visibility', width: 100 },
  { prop: 'status', label: 'table.status', width: 90 },
  { prop: 'createdAt', label: 'table.createdAt', width: 150, fmt: 'datetime' },
] as const satisfies ColumnPreset<SecurityGroup>

export const subnetColumns = [
  { prop: 'name', label: 'table.name', minWidth: 140 },
  { prop: 'cidr', label: 'network.cidr', width: 160 },
  { prop: 'subnetPrefix', label: 'network.subnetPrefix', width: 110 },
  { prop: 'status', label: 'table.status', width: 90 },
  { prop: 'createdAt', label: 'table.createdAt', width: 150, fmt: 'datetime' },
] as const satisfies ColumnPreset<Subnet>

// ─── Sandbox entities ───

export const sandboxColumns = [
  { prop: 'id', label: 'table.id', width: 180, showOverflowTooltip: true },
  { prop: 'status', label: 'table.status', width: 90, statusMap: { Running: 'success', Pending: 'warning', Scheduling: 'warning', Failed: 'danger', Stopped: 'info', Terminated: 'info', Deleted: 'info' } },
  { prop: 'providerId', label: 'sandbox.providerId', width: 140, fmt: 'truncate' },
  { prop: 'createdAt', label: 'table.createdAt', width: 150, fmt: 'datetime' },
] as const satisfies ColumnPreset<Sandbox>

export const podColumns = [
  { prop: 'id', label: 'table.id', width: 180, showOverflowTooltip: true },
  { prop: 'status', label: 'table.status', width: 90, statusMap: { Running: 'success', Pending: 'warning', Scheduling: 'warning', Failed: 'danger', Stopped: 'info', Terminated: 'info', Deleted: 'info' } },
  { prop: 'providerId', label: 'sandbox.providerId', width: 140, fmt: 'truncate' },
  { prop: 'createdAt', label: 'table.createdAt', width: 150, fmt: 'datetime' },
] as const satisfies ColumnPreset<PodInstance>

// ─── Permission entities ───

export const policyColumns = [
  { prop: 'name', label: 'table.name', minWidth: 140 },
  { prop: 'effect', label: 'policy.effect', width: 80 },
  { prop: 'actions', label: 'policy.actions', minWidth: 200, showOverflowTooltip: true },
  { prop: 'resource', label: 'policy.resource', minWidth: 180, showOverflowTooltip: true },
  { prop: 'priority', label: 'policy.priority', width: 80, align: 'center' },
  { prop: 'enabled', label: 'policy.enabled', width: 80, align: 'center' },
] as const satisfies ColumnPreset<StoredPolicy>

export const routeAclColumns = [
  { prop: 'method', label: 'acl.method', width: 80 },
  { prop: 'pathPrefix', label: 'acl.pathPrefix', minWidth: 160, showOverflowTooltip: true },
  { prop: 'matchType', label: 'acl.matchType', width: 90 },
  { prop: 'effect', label: 'policy.effect', width: 80 },
  { prop: 'priority', label: 'policy.priority', width: 80, align: 'center' },
] as const satisfies ColumnPreset<RouteAcl>

// ─── User entities ───

export const userColumns = [
  { prop: 'name', label: 'table.name', minWidth: 120 },
  { prop: 'email', label: 'table.email', minWidth: 180, showOverflowTooltip: true },
  { prop: 'role', label: 'table.role', width: 100, statusMap: { root: 'danger', Operator: 'warning', Viewer: 'info' } },
  { prop: 'createdAt', label: 'table.createdAt', width: 150, fmt: 'datetime' },
  { prop: 'updatedAt', label: 'table.updatedAt', width: 150, fmt: 'datetime' },
] as const satisfies ColumnPreset<User>

// ─── Audit ───

export const auditLogColumns = [
  { prop: 'facility', label: 'audit.facility', width: 120 },
  { prop: 'message', label: 'audit.message', minWidth: 400, showOverflowTooltip: true },
] as const satisfies ColumnPreset<AuditLog>
