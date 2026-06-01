# SandboxesApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiSandboxesGet**](#apisandboxesget) | **GET** /api/sandboxes | 列出所有沙箱（支持 ?status&#x3D;&amp;limit&#x3D;&amp;cursor&#x3D; 过滤）|
|[**apiSandboxesIdDelete**](#apisandboxesiddelete) | **DELETE** /api/sandboxes/{id} | 终止并删除沙箱|
|[**apiSandboxesIdGet**](#apisandboxesidget) | **GET** /api/sandboxes/{id} | 获取沙箱详情（含网络/容器/事件）|
|[**apiSandboxesIdHealthGet**](#apisandboxesidhealthget) | **GET** /api/sandboxes/{id}/health | 获取容器健康状态|
|[**apiSandboxesIdStopPost**](#apisandboxesidstoppost) | **POST** /api/sandboxes/{id}/stop | 停止沙箱|
|[**apiSandboxesIdSyncPost**](#apisandboxesidsyncpost) | **POST** /api/sandboxes/{id}/sync | 从 provider 同步最新运行状态|

# **apiSandboxesGet**
> object apiSandboxesGet()

列出所有沙箱（支持 ?status=&limit=&cursor= 过滤）

### Example

```typescript
import {
    SandboxesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SandboxesApi(configuration);

const { status, data } = await apiInstance.apiSandboxesGet();
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
|**200** | { items: Sandbox[], nextCursor } |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiSandboxesIdDelete**
> object apiSandboxesIdDelete()

终止并删除沙箱

### Example

```typescript
import {
    SandboxesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SandboxesApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiSandboxesIdDelete(
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

# **apiSandboxesIdGet**
> object apiSandboxesIdGet()

获取沙箱详情（含网络/容器/事件）

### Example

```typescript
import {
    SandboxesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SandboxesApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiSandboxesIdGet(
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
|**200** | Sandbox |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiSandboxesIdHealthGet**
> object apiSandboxesIdHealthGet()

获取容器健康状态

### Example

```typescript
import {
    SandboxesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SandboxesApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiSandboxesIdHealthGet(
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
|**200** | ContainerHealth[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiSandboxesIdStopPost**
> object apiSandboxesIdStopPost()

停止沙箱

### Example

```typescript
import {
    SandboxesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SandboxesApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiSandboxesIdStopPost(
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
|**200** | Sandbox |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiSandboxesIdSyncPost**
> object apiSandboxesIdSyncPost()

从 provider 同步最新运行状态

### Example

```typescript
import {
    SandboxesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SandboxesApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiSandboxesIdSyncPost(
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
|**200** | ContainerGroupRuntime |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

