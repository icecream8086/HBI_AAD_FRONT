// Re-export from field-ast.ts (canonical source)
export {
  FIELD_LIBRARY,
  resolveFields,
  groupResolved,
  validateFields,
  buildProviderOverrides,
  parseInput,
  resolveField,
  evalRule,
  evalRules,
  INSTANCE_CATEGORIES,
  filterInstanceTypes,
  instanceTag,
  INSTANCE_SPEC,
} from './field-ast'

export type {
  FieldNode,
  ResolvedField,
  VendorGroup,
  Rule,
  ValidationError,
  FieldType,
  InstanceType,
  InstanceFamily,
  InstanceSpec,
} from './field-ast'
