# Usage

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
