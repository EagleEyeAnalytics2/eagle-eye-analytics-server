# Documentation

## Notes

- ${DATABASE_KEY} represents the environment variable REACT_APP_DATABASE_KEY, so replace that part (including the dollar sign and curly braces) of it with the environment variable
- Practically all the functions require a firebase auth token, make sure you replace the ${token} in each bearer token with the actual token

## Example

```javascript
const url = `https://creategame-${DATABASE_KEY}-uc.a.run.app/`;
const gameData = {
  createdDate: new Date().getTime() / 1000,
  title: "First Game",
  holes: [],
  gameDate: new Date().getTime() / 1000,
};

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(gameData),
});
```

## Links

- [User Functions](user_functions.md)
