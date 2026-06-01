# SystemGroupsApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiSystemGroupsGet**](#apisystemgroupsget) | **GET** /api/system-groups | 列出所有系统权限组（含种子数据：perm.sysadmin / perm.operator / perm.viewer / perm.auth）|
|[**apiSystemGroupsIdDelete**](#apisystemgroupsiddelete) | **DELETE** /api/system-groups/{id} | 删除系统权限组|
|[**apiSystemGroupsIdGet**](#apisystemgroupsidget) | **GET** /api/system-groups/{id} | 按 ID 获取系统权限组详情（含规则和依赖链）|
|[**apiSystemGroupsIdPut**](#apisystemgroupsidput) | **PUT** /api/system-groups/{id} | 更新系统权限组（名称/规则/priority/dependsOn）|
|[**apiSystemGroupsPost**](#apisystemgroupspost) | **POST** /api/system-groups | 创建系统权限组 — 全局规则，不绑定用户/组。dependsOn 支持 DAG 继承父组规则|

# **apiSystemGroupsGet**
> object apiSystemGroupsGet()

列出所有系统权限组（含种子数据：perm.sysadmin / perm.operator / perm.viewer / perm.auth）

### Example

```typescript
import {
    SystemGroupsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SystemGroupsApi(configuration);

const { status, data } = await apiInstance.apiSystemGroupsGet();
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
|**200** | SysGroup[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiSystemGroupsIdDelete**
> object apiSystemGroupsIdDelete()

删除系统权限组

### Example

```typescript
import {
    SystemGroupsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SystemGroupsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiSystemGroupsIdDelete(
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

# **apiSystemGroupsIdGet**
> object apiSystemGroupsIdGet()

按 ID 获取系统权限组详情（含规则和依赖链）

### Example

```typescript
import {
    SystemGroupsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SystemGroupsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiSystemGroupsIdGet(
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
|**200** | SysGroup |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiSystemGroupsIdPut**
> object apiSystemGroupsIdPut(apiSystemGroupsIdPutRequest)

更新系统权限组（名称/规则/priority/dependsOn）

### Example

```typescript
import {
    SystemGroupsApi,
    Configuration,
    ApiSystemGroupsIdPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new SystemGroupsApi(configuration);

let id: string; //id (default to undefined)
let apiSystemGroupsIdPutRequest: ApiSystemGroupsIdPutRequest; //

const { status, data } = await apiInstance.apiSystemGroupsIdPut(
    id,
    apiSystemGroupsIdPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiSystemGroupsIdPutRequest** | **ApiSystemGroupsIdPutRequest**|  | |
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
|**200** | SysGroup |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiSystemGroupsPost**
> object apiSystemGroupsPost(apiPermissionsGroupsPostRequest)

创建系统权限组 — 全局规则，不绑定用户/组。dependsOn 支持 DAG 继承父组规则

### Example

```typescript
import {
    SystemGroupsApi,
    Configuration,
    ApiPermissionsGroupsPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new SystemGroupsApi(configuration);

let apiPermissionsGroupsPostRequest: ApiPermissionsGroupsPostRequest; //

const { status, data } = await apiInstance.apiSystemGroupsPost(
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
|**200** | SysGroup |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

