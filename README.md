# Eagle Eye Analytics: Backend

A Firebase Backend to run the necessary functionality for [eagleeyeanalytics.net](https://eagleeyeanalytics.net)

Contributors:

- Brian Kim [GitHub](https://github.com/briank1727)
- Isaac Ciravolo [GitHub](https://github.com/isaac-ciravolo)

### What is Eagle Eye Analytics?

Eagle Eye Analytics is a software for schools that want to improve at their golfing skills.

### What are some of its features?

#### Statistics

- Log your games to see crucial statistics over a range of games
- Select which games over a period of time to calculate
- See improvement with graphs and charts

#### Classes

- Coaches can make accounts to add their students
- See overall trends in the class
- Identify strengths and weaknesses to best plan their classes

#### Assignments

- Create assignemnts directly in the website
- Video links, messages, etc.

## Installation

Step 1: Clone the GitHub repository

Step 2: Run firebase login and login with a Google Account that has access to either / both the test database and the production database.

```sh
firebase login
```

Step 3: Cd into the function folder and install node_modules

```sh
cd functions
npm install
```

## Usage

### Note: All these commands are run from the root folder

To run on an emulator locally (super safe, super fast)

```sh
firebase emulators:start
```

To run on an emulator and save the data

```sh
firebase emulators:start --import=./saved-data --export-on-exit
```

Test project directly on EagleEyeAnalyticsTest

```sh
firebase use test
firebase deploy --only functions
```

Deploy product to production on EagleEyeAnalytics

```sh
firebase use prod
firebase deploy --only functions
```

## Documentation

### Notes

- ${DATABASE_KEY} represents the environment variable REACT_APP_DATABASE_KEY, so replace that part (including the dollar sign and curly braces) of it with the environment variable
- Practically all the functions require a firebase auth token, make sure you replace the ${token} in each bearer token with the actual token

### Example

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

### Links

- [User Functions](user_functions.md)
- [Game Functions](game_functions.md)
