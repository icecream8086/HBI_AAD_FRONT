# BucketPoliciesApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiTopologyBucketsIdPoliciesGet**](#apitopologybucketsidpoliciesget) | **GET** /api/topology/buckets/{id}/policies | 列出存储桶的所有 S3 策略|
|[**apiTopologyBucketsIdPoliciesPost**](#apitopologybucketsidpoliciespost) | **POST** /api/topology/buckets/{id}/policies | 创建 S3 策略|
|[**apiTopologyPoliciesIdDelete**](#apitopologypoliciesiddelete) | **DELETE** /api/topology/policies/{id} | 删除权限策略|
|[**apiTopologyPoliciesIdGet**](#apitopologypoliciesidget) | **GET** /api/topology/policies/{id} | 获取 S3 策略详情|
|[**apiTopologyPoliciesIdPut**](#apitopologypoliciesidput) | **PUT** /api/topology/policies/{id} | 更新 S3 策略|

# **apiTopologyBucketsIdPoliciesGet**
> object apiTopologyBucketsIdPoliciesGet()

所有人（只读）

### Example

```typescript
import {
    BucketPoliciesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BucketPoliciesApi(configuration);

let id: string; //Bucket ID (default to undefined)

const { status, data } = await apiInstance.apiTopologyBucketsIdPoliciesGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Bucket ID | defaults to undefined|


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
|**200** | S3Policy[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiTopologyBucketsIdPoliciesPost**
> object apiTopologyBucketsIdPoliciesPost(apiTopologyBucketsIdPoliciesPostRequest)

admin only（root/Operator/wheel）

### Example

```typescript
import {
    BucketPoliciesApi,
    Configuration,
    ApiTopologyBucketsIdPoliciesPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BucketPoliciesApi(configuration);

let id: string; //Bucket ID (default to undefined)
let apiTopologyBucketsIdPoliciesPostRequest: ApiTopologyBucketsIdPoliciesPostRequest; //

const { status, data } = await apiInstance.apiTopologyBucketsIdPoliciesPost(
    id,
    apiTopologyBucketsIdPoliciesPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiTopologyBucketsIdPoliciesPostRequest** | **ApiTopologyBucketsIdPoliciesPostRequest**|  | |
| **id** | [**string**] | Bucket ID | defaults to undefined|


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
|**200** | S3Policy |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiTopologyPoliciesIdDelete**
> object apiTopologyPoliciesIdDelete()

admin only

### Example

```typescript
import {
    BucketPoliciesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BucketPoliciesApi(configuration);

let id: string; //Policy ID (default to undefined)

const { status, data } = await apiInstance.apiTopologyPoliciesIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Policy ID | defaults to undefined|


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

# **apiTopologyPoliciesIdGet**
> object apiTopologyPoliciesIdGet()

所有人

### Example

```typescript
import {
    BucketPoliciesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BucketPoliciesApi(configuration);

let id: string; //Policy ID (default to undefined)

const { status, data } = await apiInstance.apiTopologyPoliciesIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Policy ID | defaults to undefined|


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
|**200** | S3Policy |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiTopologyPoliciesIdPut**
> object apiTopologyPoliciesIdPut(apiTopologyPoliciesIdPutRequest)

admin only

### Example

```typescript
import {
    BucketPoliciesApi,
    Configuration,
    ApiTopologyPoliciesIdPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BucketPoliciesApi(configuration);

let id: string; //Policy ID (default to undefined)
let apiTopologyPoliciesIdPutRequest: ApiTopologyPoliciesIdPutRequest; //

const { status, data } = await apiInstance.apiTopologyPoliciesIdPut(
    id,
    apiTopologyPoliciesIdPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiTopologyPoliciesIdPutRequest** | **ApiTopologyPoliciesIdPutRequest**|  | |
| **id** | [**string**] | Policy ID | defaults to undefined|


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
|**200** | S3Policy |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

