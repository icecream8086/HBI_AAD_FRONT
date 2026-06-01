# UsersApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiUsersGet**](#apiusersget) | **GET** /api/users | 列出所有用户|
|[**apiUsersIdDelete**](#apiusersiddelete) | **DELETE** /api/users/{id} | 删除用户|
|[**apiUsersIdGet**](#apiusersidget) | **GET** /api/users/{id} | 按 ID 获取用户|
|[**apiUsersIdLoginPolicyDelete**](#apiusersidloginpolicydelete) | **DELETE** /api/users/{id}/login-policy | 清除用户登录策略|
|[**apiUsersIdLoginPolicyGet**](#apiusersidloginpolicyget) | **GET** /api/users/{id}/login-policy | 获取用户登录策略|
|[**apiUsersIdLoginPolicyPut**](#apiusersidloginpolicyput) | **PUT** /api/users/{id}/login-policy | 更新用户登录策略|
|[**apiUsersIdPublicKeyDelete**](#apiusersidpublickeydelete) | **DELETE** /api/users/{id}/public-key | 清除用户 Ed25519 公钥|
|[**apiUsersIdPublicKeyGet**](#apiusersidpublickeyget) | **GET** /api/users/{id}/public-key | 获取用户 Ed25519 公钥|
|[**apiUsersIdPublicKeyPut**](#apiusersidpublickeyput) | **PUT** /api/users/{id}/public-key | 设置用户 Ed25519 公钥|
|[**apiUsersIdPut**](#apiusersidput) | **PUT** /api/users/{id} | 更新用户信息|
|[**apiUsersIdRefreshPost**](#apiusersidrefreshpost) | **POST** /api/users/{id}/refresh | 清除 KV 缓存并回源 DO 读取最新用户（1h 限频）|
|[**apiUsersLoginInfoGet**](#apiuserslogininfoget) | **GET** /api/users/login-info | 查询邮箱的登录方式（password / no-password 等）|
|[**apiUsersLoginPost**](#apiusersloginpost) | **POST** /api/users/login | POST /api/users/login|
|[**apiUsersNoPasswordLoginPost**](#apiusersnopasswordloginpost) | **POST** /api/users/no-password-login | 无密码登录（使用 oneTimeKey）|
|[**apiUsersRegisterPost**](#apiusersregisterpost) | **POST** /api/users/register | POST /api/users/register|

# **apiUsersGet**
> object apiUsersGet()

列出所有用户

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

const { status, data } = await apiInstance.apiUsersGet();
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
|**200** | UserResponse[] |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersIdDelete**
> object apiUsersIdDelete()

删除用户

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiUsersIdDelete(
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

# **apiUsersIdGet**
> object apiUsersIdGet()

按 ID 获取用户

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiUsersIdGet(
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
|**200** | UserResponse — 含 privateKeyEd25519 |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersIdLoginPolicyDelete**
> object apiUsersIdLoginPolicyDelete()

清除用户登录策略

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiUsersIdLoginPolicyDelete(
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

# **apiUsersIdLoginPolicyGet**
> object apiUsersIdLoginPolicyGet()

获取用户登录策略

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiUsersIdLoginPolicyGet(
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
|**200** | LoginPolicy | null |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersIdLoginPolicyPut**
> object apiUsersIdLoginPolicyPut(apiUsersIdLoginPolicyPutRequest)

更新用户登录策略

### Example

```typescript
import {
    UsersApi,
    Configuration,
    ApiUsersIdLoginPolicyPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //id (default to undefined)
let apiUsersIdLoginPolicyPutRequest: ApiUsersIdLoginPolicyPutRequest; //

const { status, data } = await apiInstance.apiUsersIdLoginPolicyPut(
    id,
    apiUsersIdLoginPolicyPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiUsersIdLoginPolicyPutRequest** | **ApiUsersIdLoginPolicyPutRequest**|  | |
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
|**200** | LoginPolicy |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersIdPublicKeyDelete**
> object apiUsersIdPublicKeyDelete()

清除用户 Ed25519 公钥

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiUsersIdPublicKeyDelete(
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

# **apiUsersIdPublicKeyGet**
> object apiUsersIdPublicKeyGet()

获取用户 Ed25519 公钥

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiUsersIdPublicKeyGet(
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
|**200** | string | null |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersIdPublicKeyPut**
> object apiUsersIdPublicKeyPut(apiUsersIdPublicKeyPutRequest)

设置用户 Ed25519 公钥

### Example

```typescript
import {
    UsersApi,
    Configuration,
    ApiUsersIdPublicKeyPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //id (default to undefined)
let apiUsersIdPublicKeyPutRequest: ApiUsersIdPublicKeyPutRequest; //

const { status, data } = await apiInstance.apiUsersIdPublicKeyPut(
    id,
    apiUsersIdPublicKeyPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiUsersIdPublicKeyPutRequest** | **ApiUsersIdPublicKeyPutRequest**|  | |
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
|**200** | string |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersIdPut**
> object apiUsersIdPut(apiUsersIdPutRequest)

更新用户信息

### Example

```typescript
import {
    UsersApi,
    Configuration,
    ApiUsersIdPutRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //id (default to undefined)
let apiUsersIdPutRequest: ApiUsersIdPutRequest; //

const { status, data } = await apiInstance.apiUsersIdPut(
    id,
    apiUsersIdPutRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiUsersIdPutRequest** | **ApiUsersIdPutRequest**|  | |
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
|**200** | UserResponse |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersIdRefreshPost**
> object apiUsersIdRefreshPost()

清除 KV 缓存并回源 DO 读取最新用户（1h 限频）

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let id: string; //id (default to undefined)

const { status, data } = await apiInstance.apiUsersIdRefreshPost(
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
|**200** | UserResponse |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersLoginInfoGet**
> object apiUsersLoginInfoGet()

查询邮箱的登录方式（password / no-password 等）

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

const { status, data } = await apiInstance.apiUsersLoginInfoGet();
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
|**200** | LoginInfo — { exists, methods, policy } |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersLoginPost**
> object apiUsersLoginPost()



### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

const { status, data } = await apiInstance.apiUsersLoginPost();
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
|**200** | Success |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersNoPasswordLoginPost**
> object apiUsersNoPasswordLoginPost(apiUsersNoPasswordLoginPostRequest)

无密码登录（使用 oneTimeKey）

### Example

```typescript
import {
    UsersApi,
    Configuration,
    ApiUsersNoPasswordLoginPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let apiUsersNoPasswordLoginPostRequest: ApiUsersNoPasswordLoginPostRequest; //

const { status, data } = await apiInstance.apiUsersNoPasswordLoginPost(
    apiUsersNoPasswordLoginPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiUsersNoPasswordLoginPostRequest** | **ApiUsersNoPasswordLoginPostRequest**|  | |


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
|**200** | LoginResponse — token + user |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersRegisterPost**
> object apiUsersRegisterPost()



### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

const { status, data } = await apiInstance.apiUsersRegisterPost();
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
|**200** | Success |  -  |
|**400** | Validation error |  -  |
|**403** | Forbidden / authentication required |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

