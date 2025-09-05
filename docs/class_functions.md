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
