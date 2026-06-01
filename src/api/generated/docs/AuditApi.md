# AuditApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiAuditLogsGet**](#apiauditlogsget) | **GET** /api/audit/logs | 查询审计日志（支持翻页）|
|[**apiAuditLogsStatsGet**](#apiauditlogsstatsget) | **GET** /api/audit/logs/stats | 审计日志缓冲区统计|

# **apiAuditLogsGet**
> object apiAuditLogsGet()

查询审计日志（支持翻页）

### Example

```typescript
import {
    AuditApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AuditApi(configuration);

const { status, data } = await apiInstance.apiAuditLogsGet();
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
|**200** | { page, limit, total, totalPages, lines } |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiAuditLogsStatsGet**
> object apiAuditLogsStatsGet()

审计日志缓冲区统计

### Example

```typescript
import {
    AuditApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AuditApi(configuration);

const { status, data } = await apiInstance.apiAuditLogsStatsGet();
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
|**200** | { count, capacity } |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

