# Game Functions

## Create Class

Creates a class from a coach account

Request: `https://createclass-${DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `POST`

### Header

```json
headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${token}",
},
```

### Body

- `className`: `string`

### Query Arguments

### Returns

- `201`: { message: `Class created successfully`, class: json of class Data }
- `400`: error: `Class name is required.`
- `403`: error: `User is not a coach.`
- `500`: error: `Error creating class.`

## Fetch Coach Classes

Fetches all the classes from the coach

Request: `https://fetchcoachclasses-${DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `GET`

### Headers

```json
{
  "Authorization": "Bearer ${token}"
}
```

### Query Arguments

### Returns

- `200`: classes: array of classes
- `403`: error: `User is not a coach.`
- `500`: error: `Error fetching user data.`

## Delete Class

Deletes a class based on a code

Request: `https://deleteclass-${DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `DELETE`

### Header

```json
headers: {
    "Authorization": "Bearer ${token}",
},
```

### Body

### Query Arguments

- `classCode`: The code of the class you want to delete

### Returns

- `200`: message: `Class deleted successfully.`
- `400`: error: `Class code is required.`
- `403`: error: `User is not the coach of this class.`
- `404`: error: `Class not found.`
- `500`: error: `Error deleting class.`

## Create Class Request

Creates a class request from a user account

Request: `https://createclassrequest-${DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `POST`

### Header

```json
headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${token}",
},
```

### Body

- `classCode`: `string`

### Query Arguments

### Returns

- `200`: { message: `Class join request submitted.` }
- `400`: error: `Class code is required.`
- `400`: error: `User already in class.`
- `400`: error: `Join request already submitted.`
- `403`: error: `Coaches cannot join classes.`
- `404`: error: `Class not found.`
- `500`: error: `Error processing class creation request.`

## Fetch Pending Class Requests

Fetches all the classes from the coach

Request: `https://fetchpendingclassrequests-${DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `GET`

### Headers

```json
{
  "Authorization": "Bearer ${token}"
}
```

### Query Arguments

### Returns

- `200`: requests: array of requests
- `403`: error: `User is not a coach.`
- `500`: error: `Error fetching user class requests.`

## Delete Class Request

Deletes a request based on a class code code

Request: `https://deleteclassrequest-${DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `DELETE`

### Header

```json
headers: {
    "Authorization": "Bearer ${token}",
},
```

### Body

### Query Arguments

- `classCode`: The code of the class for the request you want to delete

### Returns

- `200`: message: `Class request deleted successfully.`
- `400`: error: `Class code is required.`
- `403`: error: `User is not a student.`
- `404`: error: `Class request not found.`
- `500`: error: `Error deleting class request.`

## Fetch Coach Class Requests

Fetches all join requests for a specific class managed by the authenticated coach.

Request: `https://coachfetchclassrequests-${DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `GET`

### Headers

```json
{
  "Authorization": "Bearer ${token}"
}
```

### Query Arguments

- `classCode`: The unique identifier of the class whose join requests are to be fetched.

### Returns

- `200`: `{ requests: Array<Object> }` — Array of class request objects associated with the class.
- `400`: `{ error: "Class code is required." }` — Returned if the `classCode` query parameter is missing.
- `403`: `{ error: "User is not a coach." }` — Returned if the authenticated user is not a coach.
- `403`: `{ error: "User is not the coach of this class." }` — Returned if the user does not own the class.
- `404`: `{ error: "Class not found." }` — Returned if the class does not exist.
- `500`: `{ error: "Error fetching class requests." }` — Returned if an internal server error occurs.