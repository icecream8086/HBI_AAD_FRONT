# ContainerSecretsApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiContainerSecretsGet**](#apicontainersecretsget) | **GET** /api/container-secrets | 列出所有 ContainerSecret|
|[**apiContainerSecretsIdDelete**](#apicontainersecretsiddelete) | **DELETE** /api/container-secrets/{id} | 删除 ContainerSecret|
|[**apiContainerSecretsIdDownloadGet**](#apicontainersecretsiddownloadget) | **GET** /api/container-secrets/{id}/download | 下载 ContainerSecret 文件|
|[**apiContainerSecretsIdGet**](#apicontainersecretsidget) | **GET** /api/container-secrets/{id} | 获取 ContainerSecret 详情|
|[**apiContainerSecretsIdPut**](#apicontainersecretsidput) | **PUT** /api/container-secrets/{id} | 更新 ContainerSecret|
|[**apiContainerSecretsIdUploadPost**](#apicontainersecretsiduploadpost) | **POST** /api/container-secrets/{id}/upload | 上传 ContainerSecret 文件|
|[**apiContainerSecretsPost**](#apicontainersecretspost) | **POST** /api/container-secrets | 创建 ContainerSecret|

# **apiContainerSecretsGet**
> object apiContainerSecretsGet()

列表（value 显示 [REDACTED]）

### Example

```typescript
import {
    ContainerSecretsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ContainerSecretsApi(configuration);

const { status, data } = await apiInstance.apiContainerSecretsGet();
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
|**200** | ContainerSecret[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiContainerSecretsIdDelete**
> object apiContainerSecretsIdDelete()

删除（同步清理 blob）

### Example

```typescript
import {
    ContainerSecretsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ContainerSecretsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiContainerSecretsIdDelete(
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

# **apiContainerSecretsIdDownloadGet**
> apiContainerSecretsIdDownloadGet()

下载 upload 类型的文件内容

### Example

```typescript
import {
    ContainerSecretsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ContainerSecretsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiContainerSecretsIdDownloadGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | id | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 文件内容（octet-stream） |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiContainerSecretsIdGet**
> object apiContainerSecretsIdGet()

详情

### Example

```typescript
import {
    ContainerSecretsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ContainerSecretsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiContainerSecretsIdGet(
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
|**200** | ContainerSecret |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiContainerSecretsIdPut**
> object apiContainerSecretsIdPut(apiContainerSecretsIdPutRequest)

更新

### Example

```typescript
import {
    ContainerSecretsApi,
    Configuration,
    ApiContainerSecretsIdPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ContainerSecretsApi(configuration);

let id: string; //id (default to undefined)
let apiContainerSecretsIdPutRequest: ApiContainerSecretsIdPutRequest; //

const { status, data } = await apiInstance.apiContainerSecretsIdPut(
    id,
    apiContainerSecretsIdPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiContainerSecretsIdPutRequest** | **ApiContainerSecretsIdPutRequest**|  | |
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
|**200** | ContainerSecret |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiContainerSecretsIdUploadPost**
> object apiContainerSecretsIdUploadPost()

upload 类型上传文件（multipart, field: file）

### Example

```typescript
import {
    ContainerSecretsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ContainerSecretsApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiContainerSecretsIdUploadPost(
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
|**200** | ContainerSecret |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiContainerSecretsPost**
> object apiContainerSecretsPost(apiContainerSecretsPostRequest)

创建 ContainerSecret（body: {name, type, value?}）

### Example

```typescript
import {
    ContainerSecretsApi,
    Configuration,
    ApiContainerSecretsPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ContainerSecretsApi(configuration);

let apiContainerSecretsPostRequest: ApiContainerSecretsPostRequest; //

const { status, data } = await apiInstance.apiContainerSecretsPost(
    apiContainerSecretsPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiContainerSecretsPostRequest** | **ApiContainerSecretsPostRequest**|  | |


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
|**200** | ContainerSecret |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

