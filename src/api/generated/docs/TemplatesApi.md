# TemplatesApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiTemplatesGet**](#apitemplatesget) | **GET** /api/templates | 列出所有模板（按 visibility 过滤 — private 模板仅创建者可见）|
|[**apiTemplatesIdApplyPost**](#apitemplatesidapplypost) | **POST** /api/templates/{id}/apply | 应用模板创建沙箱 — 检查 visibility、instanceLimit、resourceBinding（domain:port 排他）|
|[**apiTemplatesIdDelete**](#apitemplatesiddelete) | **DELETE** /api/templates/{id} | 删除模板|
|[**apiTemplatesIdGet**](#apitemplatesidget) | **GET** /api/templates/{id} | 按 ID 获取模板|
|[**apiTemplatesIdPut**](#apitemplatesidput) | **PUT** /api/templates/{id} | 更新模板|
|[**apiTemplatesIdResolvedGet**](#apitemplatesidresolvedget) | **GET** /api/templates/{id}/resolved | 获取模板解析结果 — 合并 DAG 继承链后完整的 spec|
|[**apiTemplatesPost**](#apitemplatespost) | **POST** /api/templates | 创建沙箱模板 — visibility 控制可见性，instanceLimit 控制实例上限|

# **apiTemplatesGet**
> object apiTemplatesGet()

列出所有模板（按 visibility 过滤 — private 模板仅创建者可见）

### Example

```typescript
import {
    TemplatesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TemplatesApi(configuration);

const { status, data } = await apiInstance.apiTemplatesGet();
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
|**200** | SandboxTemplate[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiTemplatesIdApplyPost**
> object apiTemplatesIdApplyPost(apiTemplatesIdPutRequest)

应用模板创建沙箱 — 检查 visibility、instanceLimit、resourceBinding（domain:port 排他）

### Example

```typescript
import {
    TemplatesApi,
    Configuration,
    ApiTemplatesIdPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TemplatesApi(configuration);

let id: string; //id (default to undefined)
let apiTemplatesIdPutRequest: ApiTemplatesIdPutRequest; //

const { status, data } = await apiInstance.apiTemplatesIdApplyPost(
    id,
    apiTemplatesIdPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiTemplatesIdPutRequest** | **ApiTemplatesIdPutRequest**|  | |
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
|**200** | Sandbox |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiTemplatesIdDelete**
> object apiTemplatesIdDelete()

删除模板

### Example

```typescript
import {
    TemplatesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TemplatesApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiTemplatesIdDelete(
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

# **apiTemplatesIdGet**
> object apiTemplatesIdGet()

按 ID 获取模板

### Example

```typescript
import {
    TemplatesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TemplatesApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiTemplatesIdGet(
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
|**200** | SandboxTemplate |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiTemplatesIdPut**
> object apiTemplatesIdPut(apiTemplatesIdPutRequest)

更新模板

### Example

```typescript
import {
    TemplatesApi,
    Configuration,
    ApiTemplatesIdPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TemplatesApi(configuration);

let id: string; //id (default to undefined)
let apiTemplatesIdPutRequest: ApiTemplatesIdPutRequest; //

const { status, data } = await apiInstance.apiTemplatesIdPut(
    id,
    apiTemplatesIdPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiTemplatesIdPutRequest** | **ApiTemplatesIdPutRequest**|  | |
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
|**200** | SandboxTemplate |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiTemplatesIdResolvedGet**
> object apiTemplatesIdResolvedGet()

获取模板解析结果 — 合并 DAG 继承链后完整的 spec

### Example

```typescript
import {
    TemplatesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TemplatesApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiTemplatesIdResolvedGet(
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
|**200** | SandboxTemplate |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiTemplatesPost**
> object apiTemplatesPost(apiTemplatesPostRequest)

创建沙箱模板 — visibility 控制可见性，instanceLimit 控制实例上限

### Example

```typescript
import {
    TemplatesApi,
    Configuration,
    ApiTemplatesPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TemplatesApi(configuration);

let apiTemplatesPostRequest: ApiTemplatesPostRequest; //

const { status, data } = await apiInstance.apiTemplatesPost(
    apiTemplatesPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiTemplatesPostRequest** | **ApiTemplatesPostRequest**|  | |


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
|**200** | SandboxTemplate |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

