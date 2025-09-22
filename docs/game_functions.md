# Game Functions

## Create Game

Deletes a user from either the users/coach folder and from the authentication

If you want to make a random hole, use the random9 and random18 query parameters, and you don't need to provide a body if you are making a random game.

Request: `https://creategame-$[DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `POST`

### Header

```json
headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${token}",
},
```

### Body

- `createdDate`: `number`
  - Unix Epoch Time in Seconds
- `gameDate`: `number`
  - Unix Epoch Time in Seconds
- `title`: `string`
  - Must not be empty
- `holes`: `array`
  - Must have 9 or 18 holes
  - `hole`: `json`
    - Note: All strings listed must be non-empty
      - `approachClub`: `string`
      - `approachShot`: `string`
      - `teeClub`: `string`
      - `teeShot`: `string`
      - `upAndDown`: `string`
      - `upAndDownClub`: `string`
    - Note: All numbers listed must be >= 0
      - `firstPuttDist`: `number`
      - `penaltyStrokes`: `number`
      - `score`: `number`
      - `shotsInside100`: `number`
      - `totalPutts`: `number`
      - `yardage`: `number`
    - `par`: `number`
      - Must be "-", 3, 4, or 5

### Query Arguments

### Returns

- `201`: message: `Game create successfully`
- `403`: error: `Coaches cannot create games.`
- `400`: error: Error containing invalid game status
- `500`: error: `Error creating game`

## Fetch Game

Fetches a game based on an id

Request: `https://creategame-$[DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `GET`

### Header

```json
headers: {
    "Authorization": "Bearer ${token}",
},
```

### Body

### Query Arguments

- `gameId`: The id of the game you want to fetch

### Returns

- `200`: json of the game
- `400`: error: `Missing gameId parameter`
- `403`: error: `Coaches cannot fetch games.`
- `404`: error: `Game not found`
- `500`: error: `Error fetching game`

## Update Game

Updates a game based on an id

Request: `https://updategame-$[DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `PUT`

### Header

```json
headers: {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json",
},
```

### Body

See [Create Game Body](#body) for details on the required fields and structure.

### Query Arguments

- `gameId`: The id of the game you want to update

### Returns

- `200`: message: `Game updated successfully`
- `400`: error: Error containing invalid game status
- `403`: error: `Coaches cannot update games.`
- `404`: error: `Game not found`
- `500`: error: `Error updating game`

## Delete Game

Deletes a game based on an id

Request: `https://deletegame-$[DATABASE-KEY}-uc.a.run.app/`

HTTPS Request Type: `DELETE`

### Header

```json
headers: {
    "Authorization": "Bearer ${token}",
},
```

### Body

### Query Arguments

- `gameId`: The id of the game you want to delete

### Returns

- `200`: message: `Game deleted successfully`
- `400`: error: `Missing gameId parameter`
- `403`: error: `Coaches cannot fetch games.`
- `404`: error: `Game not found`
- `500`: error: `Error deleting game`
