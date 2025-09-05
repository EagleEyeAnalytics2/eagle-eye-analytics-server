# Game Functions

## Create Class

Creates a class from a coach account

Request: `https://createclass-$[DATABASE-KEY}-uc.a.run.app/`

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

Request: `https://fetchcoachclasses-$[DATABASE-KEY}-uc.a.run.app/`

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

Deletes a class based on an id

Request: `https://deleteclass-$[DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `DELETE`

### Header

```json
headers: {
    "Authorization": "Bearer ${token}",
},
```

### Body

### Query Arguments

- `classId`: The id of the class you want to delete

### Returns

- `200`: message: `Class deleted successfully.`
- `400`: error: `Class ID is required.`
- `403`: error: `User is not the coach of this class.`
- `404`: error: `Class not found.`
- `500`: error: `Error deleting class.`
