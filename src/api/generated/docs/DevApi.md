# DevApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**becomeWheelPost**](#becomewheelpost) | **POST** /__become-wheel | Add user to simulate_wheel group (localhost only)|

# **becomeWheelPost**
> object becomeWheelPost(becomeWheelPostRequest)

Add user to simulate_wheel group (localhost only)

### Example

```typescript
import {
    DevApi,
    Configuration,
    BecomeWheelPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DevApi(configuration);

let becomeWheelPostRequest: BecomeWheelPostRequest; //

const { status, data } = await apiInstance.becomeWheelPost(
    becomeWheelPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **becomeWheelPostRequest** | **BecomeWheelPostRequest**|  | |


### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | { success, data } |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

