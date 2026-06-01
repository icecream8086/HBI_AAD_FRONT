# PlatformsApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiPlatformsGet**](#apiplatformsget) | **GET** /api/platforms | 列出所有可用平台（podman / alibaba / stub）|

# **apiPlatformsGet**
> object apiPlatformsGet()

列出所有可用平台（podman / alibaba / stub）

### Example

```typescript
import {
    PlatformsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PlatformsApi(configuration);

const { status, data } = await apiInstance.apiPlatformsGet();
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
|**200** | { name }[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

