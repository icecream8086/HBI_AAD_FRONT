# InfoApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**infoGet**](#infoget) | **GET** /info | 返回服务器基本信息（名称、版本、已开启功能、运行时长、缓存命中率）|

# **infoGet**
> object infoGet()

返回服务器基本信息（名称、版本、已开启功能、运行时长、缓存命中率）

### Example

```typescript
import {
    InfoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfoApi(configuration);

const { status, data } = await apiInstance.infoGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | ServerInfo — name, version, platform, features, uptime, storeMetrics |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

