# User Functions

## Create User

Creates a user for authentication purposes and a folder in users/coach for data

Note: This function does not require a Bearer Token

Request: `https://createuser-${DATABASE_KEY}-uc.a.run.app/`

HTTPS Request Type: `POST`

### Headers

```json
{
  "Content-Type": "application/json"
}
```

### Body

- `email`: `string`
  - Should be a valid email
  - Must pass the regex `/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i`
- `password`: `string`
  - Longer than 6
  - Must pass the regex `/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/`
- `firstName`: `string`
  - Must be at least one character long
  - Must only contain letters
- `lastName`: `string`
  - Must be at least one character long
  - Must only contain letters

### Query Arguments

### Returns

- `201`: `User created successfully.`
- `400`: Parameter error
- `500`: `Error creating user. ${error.message}`

## Fetch User Data

Fetches a user from either the users/coach folder

Request: `https://fetchuserdata-$[DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `GET`

### Headers

```json
{
  "Authorization": "Bearer ${token}"
}
```

### Query Arguments

### Returns

- `200`:

  - `classes`: `array`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `id`: `string`
  - `isCoach`: `boolean`
  - `joined`: `number`
    - Unix Epoch Time in Seconds

- `404`: `User not found.`
- `500`: `Error fetching user data. ${error.message}`

## Delete User

Deletes a user from either the users/coach folder and from the authentication

Request: `https://deleteuser-$[DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `DELETE`

### Headers

```json
{
  "Authorization": "Bearer ${token}"
}
```

### Query Arguments

### Returns

- `200`: `User deleted successfully`
- `500`: `Error deleting user. ${error.message}`
