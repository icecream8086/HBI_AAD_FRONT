# PermissionsApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiPermissionsCheckPost**](#apipermissionscheckpost) | **POST** /api/permissions/check | 权限检查 — 模拟某用户对某资源的访问权限。评估 loginPolicy + 个人策略 + 权限组规则 + DAG 继承链|
|[**apiPermissionsComparePermGroupsPost**](#apipermissionscomparepermgroupspost) | **POST** /api/permissions/compare/perm-groups | 对比两个权限组 — 选取两个权限组 id，返回规则差异(common/onlyA/onlyB) 和 DAG 依赖链差异(depDiff)|
|[**apiPermissionsCompareUserGroupsPost**](#apipermissionscompareusergroupspost) | **POST** /api/permissions/compare/user-groups | 对比两个用户组 — 选取两个用户组 id，返回成员差异(common/onlyA/onlyB) 和 DAG 依赖链差异(depDiff)|
|[**apiPermissionsGroupsFromTemplateTemplateIdPost**](#apipermissionsgroupsfromtemplatetemplateidpost) | **POST** /api/permissions/groups/from-template/{templateId} | 从模板创建权限组 — 内置模板: admin(完全), operator(CRUD), viewer(只读), login-only(仅登录)|
|[**apiPermissionsGroupsGet**](#apipermissionsgroupsget) | **GET** /api/permissions/groups | 列出所有权限组|
|[**apiPermissionsGroupsIdDelete**](#apipermissionsgroupsiddelete) | **DELETE** /api/permissions/groups/{id} | 删除权限组|
|[**apiPermissionsGroupsIdGet**](#apipermissionsgroupsidget) | **GET** /api/permissions/groups/{id} | 按 ID 获取权限组（含规则和绑定列表）|
|[**apiPermissionsGroupsIdPut**](#apipermissionsgroupsidput) | **PUT** /api/permissions/groups/{id} | 更新权限组（名称/规则/dependsOn/绑定的用户或组）|
|[**apiPermissionsGroupsPost**](#apipermissionsgroupspost) | **POST** /api/permissions/groups | 创建权限组 — 一组规则集合，可绑定到用户组或用户。dependsOn 继承父组规则|
|[**apiPermissionsLogPolicyGet**](#apipermissionslogpolicyget) | **GET** /api/permissions/log-policy | 获取全局日志策略配置（默认值 + 各 facility 级别）。无策略时返回内置默认值|
|[**apiPermissionsLogPolicyPut**](#apipermissionslogpolicyput) | **PUT** /api/permissions/log-policy | 更新全局日志策略 — 调整 defaultLevel/auditLevel/facilities[]。仅 wheel 组可操作|
|[**apiPermissionsPoliciesGet**](#apipermissionspoliciesget) | **GET** /api/permissions/policies | 列出所有权限策略|
|[**apiPermissionsPoliciesIdDelete**](#apipermissionspoliciesiddelete) | **DELETE** /api/permissions/policies/{id} | 删除策略|
|[**apiPermissionsPoliciesIdGet**](#apipermissionspoliciesidget) | **GET** /api/permissions/policies/{id} | 按 ID 获取策略详情|
|[**apiPermissionsPoliciesIdPut**](#apipermissionspoliciesidput) | **PUT** /api/permissions/policies/{id} | 更新策略（name/effect/actions/priority/enabled）|
|[**apiPermissionsPoliciesPost**](#apipermissionspoliciespost) | **POST** /api/permissions/policies | 创建权限策略 — 定义一条 (who, action, resource) 的 allow/deny 规则，可绑定到 userId 或 role|
|[**apiPermissionsRouteAclsGet**](#apipermissionsrouteaclsget) | **GET** /api/permissions/route-acls | 列出所有路由绑定|
|[**apiPermissionsRouteAclsIdDelete**](#apipermissionsrouteaclsiddelete) | **DELETE** /api/permissions/route-acls/{id} | 删除路由绑定|
|[**apiPermissionsRouteAclsIdGet**](#apipermissionsrouteaclsidget) | **GET** /api/permissions/route-acls/{id} | 按 ID 获取路由绑定|
|[**apiPermissionsRouteAclsIdPut**](#apipermissionsrouteaclsidput) | **PUT** /api/permissions/route-acls/{id} | 更新路由绑定 — 可改 method/matchType/effect/priority|
|[**apiPermissionsRouteAclsPost**](#apipermissionsrouteaclspost) | **POST** /api/permissions/route-acls | 创建路由绑定 — 定义 (method + path) 谁可以访问。绑定到 userId 或 userGroupId|
|[**apiPermissionsTemplatesGet**](#apipermissionstemplatesget) | **GET** /api/permissions/templates | 列出内置权限模板（admin / operator / viewer / login-only）|
|[**apiPermissionsTemplatesIdGet**](#apipermissionstemplatesidget) | **GET** /api/permissions/templates/{id} | 按 ID 获取内置模板详情|
|[**apiPermissionsUserGroupsGet**](#apipermissionsusergroupsget) | **GET** /api/permissions/user-groups | 列出所有用户组|
|[**apiPermissionsUserGroupsIdDelete**](#apipermissionsusergroupsiddelete) | **DELETE** /api/permissions/user-groups/{id} | 删除用户组|
|[**apiPermissionsUserGroupsIdGet**](#apipermissionsusergroupsidget) | **GET** /api/permissions/user-groups/{id} | 按 ID 获取用户组（含成员列表）|
|[**apiPermissionsUserGroupsIdPut**](#apipermissionsusergroupsidput) | **PUT** /api/permissions/user-groups/{id} | 更新用户组（名称/成员/dependsOn 依赖）|
|[**apiPermissionsUserGroupsPost**](#apipermissionsusergroupspost) | **POST** /api/permissions/user-groups | 创建用户组 — 组内用户共享权限。dependsOn 支持 DAG 继承父组|
|[**apiPermissionsUserTemplatesGet**](#apipermissionsusertemplatesget) | **GET** /api/permissions/user-templates | 列出所有用户模板|
|[**apiPermissionsUserTemplatesIdDelete**](#apipermissionsusertemplatesiddelete) | **DELETE** /api/permissions/user-templates/{id} | 删除用户模板|
|[**apiPermissionsUserTemplatesIdGet**](#apipermissionsusertemplatesidget) | **GET** /api/permissions/user-templates/{id} | 按 ID 获取用户模板|
|[**apiPermissionsUserTemplatesIdPut**](#apipermissionsusertemplatesidput) | **PUT** /api/permissions/user-templates/{id} | 更新用户模板|
|[**apiPermissionsUserTemplatesPost**](#apipermissionsusertemplatespost) | **POST** /api/permissions/user-templates | 创建用户模板 — 预设新用户注册时自动加入哪些组。dependsOn 支持模板继承|

# **apiPermissionsCheckPost**
> object apiPermissionsCheckPost(apiPermissionsCheckPostRequest)

权限检查 — 模拟某用户对某资源的访问权限。评估 loginPolicy + 个人策略 + 权限组规则 + DAG 继承链

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsCheckPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let apiPermissionsCheckPostRequest: ApiPermissionsCheckPostRequest; //

const { status, data } = await apiInstance.apiPermissionsCheckPost(
    apiPermissionsCheckPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsCheckPostRequest** | **ApiPermissionsCheckPostRequest**|  | |


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | PolicyMatchResult |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsComparePermGroupsPost**
> object apiPermissionsComparePermGroupsPost(apiPermissionsComparePermGroupsPostRequest)

对比两个权限组 — 选取两个权限组 id，返回规则差异(common/onlyA/onlyB) 和 DAG 依赖链差异(depDiff)

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsComparePermGroupsPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let apiPermissionsComparePermGroupsPostRequest: ApiPermissionsComparePermGroupsPostRequest; //

const { status, data } = await apiInstance.apiPermissionsComparePermGroupsPost(
    apiPermissionsComparePermGroupsPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsComparePermGroupsPostRequest** | **ApiPermissionsComparePermGroupsPostRequest**|  | |


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | CompareResult |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsCompareUserGroupsPost**
> object apiPermissionsCompareUserGroupsPost(apiPermissionsComparePermGroupsPostRequest)

对比两个用户组 — 选取两个用户组 id，返回成员差异(common/onlyA/onlyB) 和 DAG 依赖链差异(depDiff)

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsComparePermGroupsPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let apiPermissionsComparePermGroupsPostRequest: ApiPermissionsComparePermGroupsPostRequest; //

const { status, data } = await apiInstance.apiPermissionsCompareUserGroupsPost(
    apiPermissionsComparePermGroupsPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsComparePermGroupsPostRequest** | **ApiPermissionsComparePermGroupsPostRequest**|  | |


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | CompareResult |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsGroupsFromTemplateTemplateIdPost**
> object apiPermissionsGroupsFromTemplateTemplateIdPost(apiPermissionsGroupsFromTemplateTemplateIdPostRequest)

从模板创建权限组 — 内置模板: admin(完全), operator(CRUD), viewer(只读), login-only(仅登录)

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsGroupsFromTemplateTemplateIdPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let templateId: string; //templateId (default to undefined)
let apiPermissionsGroupsFromTemplateTemplateIdPostRequest: ApiPermissionsGroupsFromTemplateTemplateIdPostRequest; //

const { status, data } = await apiInstance.apiPermissionsGroupsFromTemplateTemplateIdPost(
    templateId,
    apiPermissionsGroupsFromTemplateTemplateIdPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsGroupsFromTemplateTemplateIdPostRequest** | **ApiPermissionsGroupsFromTemplateTemplateIdPostRequest**|  | |
| **templateId** | [**string**] | templateId | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | PermissionGroup |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsGroupsGet**
> object apiPermissionsGroupsGet()

列出所有权限组

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

const { status, data } = await apiInstance.apiPermissionsGroupsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | PermissionGroup[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsGroupsIdDelete**
> object apiPermissionsGroupsIdDelete()

删除权限组

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiPermissionsGroupsIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | { ok: true } |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsGroupsIdGet**
> object apiPermissionsGroupsIdGet()

按 ID 获取权限组（含规则和绑定列表）

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiPermissionsGroupsIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | PermissionGroup |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsGroupsIdPut**
> object apiPermissionsGroupsIdPut(apiPermissionsGroupsIdPutRequest)

更新权限组（名称/规则/dependsOn/绑定的用户或组）

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsGroupsIdPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)
let apiPermissionsGroupsIdPutRequest: ApiPermissionsGroupsIdPutRequest; //

const { status, data } = await apiInstance.apiPermissionsGroupsIdPut(
    id,
    apiPermissionsGroupsIdPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsGroupsIdPutRequest** | **ApiPermissionsGroupsIdPutRequest**|  | |
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | PermissionGroup |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsGroupsPost**
> object apiPermissionsGroupsPost(apiPermissionsGroupsPostRequest)

创建权限组 — 一组规则集合，可绑定到用户组或用户。dependsOn 继承父组规则

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsGroupsPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let apiPermissionsGroupsPostRequest: ApiPermissionsGroupsPostRequest; //

const { status, data } = await apiInstance.apiPermissionsGroupsPost(
    apiPermissionsGroupsPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsGroupsPostRequest** | **ApiPermissionsGroupsPostRequest**|  | |


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | PermissionGroup |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsLogPolicyGet**
> object apiPermissionsLogPolicyGet()

获取全局日志策略配置（默认值 + 各 facility 级别）。无策略时返回内置默认值

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

const { status, data } = await apiInstance.apiPermissionsLogPolicyGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | LogPolicy |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsLogPolicyPut**
> object apiPermissionsLogPolicyPut(apiPermissionsLogPolicyPutRequest)

更新全局日志策略 — 调整 defaultLevel/auditLevel/facilities[]。仅 wheel 组可操作

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsLogPolicyPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let apiPermissionsLogPolicyPutRequest: ApiPermissionsLogPolicyPutRequest; //

const { status, data } = await apiInstance.apiPermissionsLogPolicyPut(
    apiPermissionsLogPolicyPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsLogPolicyPutRequest** | **ApiPermissionsLogPolicyPutRequest**|  | |


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | LogPolicy |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsPoliciesGet**
> object apiPermissionsPoliciesGet()

列出所有权限策略

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

const { status, data } = await apiInstance.apiPermissionsPoliciesGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | StoredPolicy[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsPoliciesIdDelete**
> object apiPermissionsPoliciesIdDelete()

删除策略

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiPermissionsPoliciesIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | { ok: true } |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsPoliciesIdGet**
> object apiPermissionsPoliciesIdGet()

按 ID 获取策略详情

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiPermissionsPoliciesIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | StoredPolicy |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsPoliciesIdPut**
> object apiPermissionsPoliciesIdPut(apiPermissionsPoliciesIdPutRequest)

更新策略（name/effect/actions/priority/enabled）

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsPoliciesIdPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)
let apiPermissionsPoliciesIdPutRequest: ApiPermissionsPoliciesIdPutRequest; //

const { status, data } = await apiInstance.apiPermissionsPoliciesIdPut(
    id,
    apiPermissionsPoliciesIdPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsPoliciesIdPutRequest** | **ApiPermissionsPoliciesIdPutRequest**|  | |
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | StoredPolicy |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsPoliciesPost**
> object apiPermissionsPoliciesPost(apiPermissionsPoliciesPostRequest)

创建权限策略 — 定义一条 (who, action, resource) 的 allow/deny 规则，可绑定到 userId 或 role

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsPoliciesPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let apiPermissionsPoliciesPostRequest: ApiPermissionsPoliciesPostRequest; //

const { status, data } = await apiInstance.apiPermissionsPoliciesPost(
    apiPermissionsPoliciesPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsPoliciesPostRequest** | **ApiPermissionsPoliciesPostRequest**|  | |


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | StoredPolicy |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsRouteAclsGet**
> object apiPermissionsRouteAclsGet()

列出所有路由绑定

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

const { status, data } = await apiInstance.apiPermissionsRouteAclsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | RouteAcl[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsRouteAclsIdDelete**
> object apiPermissionsRouteAclsIdDelete()

删除路由绑定

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiPermissionsRouteAclsIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | { ok: true } |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsRouteAclsIdGet**
> object apiPermissionsRouteAclsIdGet()

按 ID 获取路由绑定

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiPermissionsRouteAclsIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | RouteAcl |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsRouteAclsIdPut**
> object apiPermissionsRouteAclsIdPut(apiPermissionsRouteAclsIdPutRequest)

更新路由绑定 — 可改 method/matchType/effect/priority

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsRouteAclsIdPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)
let apiPermissionsRouteAclsIdPutRequest: ApiPermissionsRouteAclsIdPutRequest; //

const { status, data } = await apiInstance.apiPermissionsRouteAclsIdPut(
    id,
    apiPermissionsRouteAclsIdPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsRouteAclsIdPutRequest** | **ApiPermissionsRouteAclsIdPutRequest**|  | |
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | RouteAcl |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsRouteAclsPost**
> object apiPermissionsRouteAclsPost(apiPermissionsRouteAclsPostRequest)

创建路由绑定 — 定义 (method + path) 谁可以访问。绑定到 userId 或 userGroupId

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsRouteAclsPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let apiPermissionsRouteAclsPostRequest: ApiPermissionsRouteAclsPostRequest; //

const { status, data } = await apiInstance.apiPermissionsRouteAclsPost(
    apiPermissionsRouteAclsPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsRouteAclsPostRequest** | **ApiPermissionsRouteAclsPostRequest**|  | |


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | RouteAcl |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsTemplatesGet**
> object apiPermissionsTemplatesGet()

列出内置权限模板（admin / operator / viewer / login-only）

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

const { status, data } = await apiInstance.apiPermissionsTemplatesGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Template[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsTemplatesIdGet**
> object apiPermissionsTemplatesIdGet()

按 ID 获取内置模板详情

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiPermissionsTemplatesIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Template |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsUserGroupsGet**
> object apiPermissionsUserGroupsGet()

列出所有用户组

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

const { status, data } = await apiInstance.apiPermissionsUserGroupsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | UserGroup[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsUserGroupsIdDelete**
> object apiPermissionsUserGroupsIdDelete()

删除用户组

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiPermissionsUserGroupsIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | { ok: true } |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsUserGroupsIdGet**
> object apiPermissionsUserGroupsIdGet()

按 ID 获取用户组（含成员列表）

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiPermissionsUserGroupsIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | UserGroup |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsUserGroupsIdPut**
> object apiPermissionsUserGroupsIdPut(apiPermissionsUserGroupsPostRequest)

更新用户组（名称/成员/dependsOn 依赖）

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsUserGroupsPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)
let apiPermissionsUserGroupsPostRequest: ApiPermissionsUserGroupsPostRequest; //

const { status, data } = await apiInstance.apiPermissionsUserGroupsIdPut(
    id,
    apiPermissionsUserGroupsPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsUserGroupsPostRequest** | **ApiPermissionsUserGroupsPostRequest**|  | |
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | UserGroup |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsUserGroupsPost**
> object apiPermissionsUserGroupsPost(apiPermissionsUserGroupsPostRequest)

创建用户组 — 组内用户共享权限。dependsOn 支持 DAG 继承父组

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsUserGroupsPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let apiPermissionsUserGroupsPostRequest: ApiPermissionsUserGroupsPostRequest; //

const { status, data } = await apiInstance.apiPermissionsUserGroupsPost(
    apiPermissionsUserGroupsPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsUserGroupsPostRequest** | **ApiPermissionsUserGroupsPostRequest**|  | |


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | UserGroup |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsUserTemplatesGet**
> object apiPermissionsUserTemplatesGet()

列出所有用户模板

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

const { status, data } = await apiInstance.apiPermissionsUserTemplatesGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | UserTemplate[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsUserTemplatesIdDelete**
> object apiPermissionsUserTemplatesIdDelete()

删除用户模板

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiPermissionsUserTemplatesIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | { ok: true } |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsUserTemplatesIdGet**
> object apiPermissionsUserTemplatesIdGet()

按 ID 获取用户模板

### Example

```typescript
import {
    PermissionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiPermissionsUserTemplatesIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | UserTemplate |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsUserTemplatesIdPut**
> object apiPermissionsUserTemplatesIdPut(apiPermissionsUserTemplatesIdPutRequest)

更新用户模板

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsUserTemplatesIdPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let id: string; //id (default to undefined)
let apiPermissionsUserTemplatesIdPutRequest: ApiPermissionsUserTemplatesIdPutRequest; //

const { status, data } = await apiInstance.apiPermissionsUserTemplatesIdPut(
    id,
    apiPermissionsUserTemplatesIdPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsUserTemplatesIdPutRequest** | **ApiPermissionsUserTemplatesIdPutRequest**|  | |
| **id** | [**string**] | id | defaults to undefined|


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | UserTemplate |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiPermissionsUserTemplatesPost**
> object apiPermissionsUserTemplatesPost(apiPermissionsUserTemplatesPostRequest)

创建用户模板 — 预设新用户注册时自动加入哪些组。dependsOn 支持模板继承

### Example

```typescript
import {
    PermissionsApi,
    Configuration,
    ApiPermissionsUserTemplatesPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionsApi(configuration);

let apiPermissionsUserTemplatesPostRequest: ApiPermissionsUserTemplatesPostRequest; //

const { status, data } = await apiInstance.apiPermissionsUserTemplatesPost(
    apiPermissionsUserTemplatesPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiPermissionsUserTemplatesPostRequest** | **ApiPermissionsUserTemplatesPostRequest**|  | |


### Return type

**object**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | UserTemplate |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

