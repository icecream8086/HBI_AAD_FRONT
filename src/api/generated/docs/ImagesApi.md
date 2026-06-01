# ImagesApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiImagesGet**](#apiimagesget) | **GET** /api/images | 列出所有镜像（通过当前 provider）|
|[**apiImagesIdDelete**](#apiimagesiddelete) | **DELETE** /api/images/{id} | 删除镜像|
|[**apiImagesIdGet**](#apiimagesidget) | **GET** /api/images/{id} | 查看镜像详情|
|[**apiImagesPullPost**](#apiimagespullpost) | **POST** /api/images/pull | 拉取镜像（支持所有 provider）|

# **apiImagesGet**
> object apiImagesGet()

列出所有镜像（通过当前 provider）

### Example

```typescript
import {
    ImagesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ImagesApi(configuration);

const { status, data } = await apiInstance.apiImagesGet();
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
|**200** | ImageInfo[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiImagesIdDelete**
> object apiImagesIdDelete()

删除镜像

### Example

```typescript
import {
    ImagesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ImagesApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiImagesIdDelete(
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

# **apiImagesIdGet**
> object apiImagesIdGet()

查看镜像详情

### Example

```typescript
import {
    ImagesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ImagesApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiImagesIdGet(
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
|**200** | ImageInfo |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiImagesPullPost**
> object apiImagesPullPost(apiImagesPullPostRequest)

拉取镜像（支持所有 provider）

### Example

```typescript
import {
    ImagesApi,
    Configuration,
    ApiImagesPullPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ImagesApi(configuration);

let apiImagesPullPostRequest: ApiImagesPullPostRequest; //

const { status, data } = await apiInstance.apiImagesPullPost(
    apiImagesPullPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiImagesPullPostRequest** | **ApiImagesPullPostRequest**|  | |


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
|**200** | ImageInfo |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

