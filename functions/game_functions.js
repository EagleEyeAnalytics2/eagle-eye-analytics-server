import { onRequest } from "firebase-functions/v2/https";
import { admin, db } from "./admin.js";
import { handleCors, withVerifiedEmail, withVerifiedId } from "./wrappers.js";
import { clubs, teeShots, approachShots } from "./constants.js";

const validateGame = (game) => {
  if (!game.createdDate) {
    return "Missing createdDate";
  }
  if (typeof game.createdDate !== "number" || game.createdDate <= 0) {
    return "Invalid createdDate - must be a positive epoch timestamp";
  }
  if (!game.gameDate) {
    return "Missing gameDate";
  }
  if (typeof game.gameDate !== "number" || game.gameDate <= 0) {
    return "Invalid gameDate - must be a positive epoch timestamp";
  }
  if (!game.title) {
    return "Missing title";
  }
  if (typeof game.title !== "string" || game.title.trim() === "") {
    return "Invalid title - must be a non-empty string";
  }
  if (!game.holes) {
    return "Missing holes";
  }
  if (
    !Array.isArray(game.holes) ||
    (game.holes.length !== 9 && game.holes.length !== 18)
  ) {
    return "Invalid holes - must be an array with exactly 9 or 18 holes";
  }
  for (let i = 0; i < game.holes.length; i++) {
    const hole = game.holes[i];
    const stringVariables = [
      "approachClub",
      "approachShot",
      "teeClub",
      "teeShot",
      "upAndDown",
      "upAndDownClub",
    ];
    for (const variable of stringVariables) {
      if (!hole[variable]) {
        return `Invalid hole - must have a ${variable}`;
      }
      if (typeof hole[variable] !== "string" || hole[variable].trim() === "") {
        return `Invalid hole - ${variable} must be a non-empty string`;
      }
    }
    const nonZeroNumberVariables = [
      "firstPuttDist",
      "penaltyStrokes",
      "score",
      "shotsInside100",
      "totalPutts",
      "yardage",
    ];

    for (const variable of nonZeroNumberVariables) {
      if (hole[variable] === undefined) {
        return `Invalid hole - must have a ${variable}`;
      }
      if (typeof hole[variable] !== "number" || hole[variable] < 0) {
        return `Invalid hole - ${variable} must be a non-negative number (${hole[variable]})`;
      }
    }

    if (!hole.par) {
      return `Invalid hole - must have a par`;
    }
    if (
      hole.par !== "-" &&
      hole.par !== 3 &&
      hole.par !== 4 &&
      hole.par !== 5
    ) {
      return `Invalid hole - par must be between 3 and 5 (${hole.par})`;
    }
  }
  return null;
};

const createRandomGame = (numHoles) => {
  const newHoles = [];
  for (let i = 0; i < numHoles; i++) {
    const newHole = {};
    newHole.par = [3, 4, 5][Math.floor(Math.random() * 3)];
    if (newHole.par === 3)
      newHole.yardage = Math.floor(Math.random() * (200 - 140 + 1)) + 140;
    if (newHole.par === 4)
      newHole.yardage = Math.floor(Math.random() * (450 - 300 + 1)) + 300;
    if (newHole.par === 5)
      newHole.yardage = Math.floor(Math.random() * (700 - 500 + 1)) + 500;
    newHole.score = newHole.par + Math.floor(Math.random() * 3); // 0-2 over/under par
    if (newHole.par > 3) {
      newHole.teeClub =
        clubs[Math.floor(Math.random() * (clubs.length - 1)) + 1];
      newHole.teeShot =
        teeShots[Math.floor(Math.random() * (teeShots.length - 1)) + 1];
    } else {
      newHole.teeClub = clubs[0];
      newHole.teeShot = teeShots[0];
    }
    newHole.approachClub =
      clubs[Math.floor(Math.random() * (clubs.length - 1)) + 1];
    newHole.approachShot =
      approachShots[Math.floor(Math.random() * (approachShots.length - 1)) + 1];

    if (newHole.approachShot !== "GIR") {
      newHole.upAndDown = ["Yes", "No"][Math.floor(Math.random() * 2)];
      newHole.upAndDownClub =
        clubs[Math.floor(Math.random() * (clubs.length - 1)) + 1];
    } else {
      newHole.upAndDown = "-";
      newHole.upAndDownClub = "-";
    }
    newHole.totalPutts = Math.floor(Math.random() * 3) + 1;
    newHole.firstPuttDist = Math.floor(Math.random() * 30);
    newHole.penaltyStrokes = Math.floor(Math.random() * 2);
    newHole.shotsInside100 = Math.floor(Math.random() * 3);
    newHoles.push(newHole);
  }
  return {
    createdDate: new Date().getTime() / 1000,
    title: "Random Round",
    holes: newHoles,
    gameDate: new Date().getTime() / 1000,
  };
};

export const createGame = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedId(req, res, async (req, res) => {
      try {
        const uid = req.user.uid;
        const userRecord = await admin.auth().getUser(uid);
        if (userRecord.customClaims.isCoach) {
          res.status(403).json({ error: "Coaches cannot create games." });
          return;
        }

        let gameData = null;
        if (req.query.random18 && req.query.random18 === "true") {
          gameData = createRandomGame(18);
        } else if (req.query.random9 && req.query.random9 === "true") {
          gameData = createRandomGame(9);
        } else {
          gameData = req.body;
        }

        if (validateGame(gameData)) {
          res.status(400).json({ error: validateGame(gameData) });
          return;
        }

        const gameRef = db.collection(`users/${uid}/games`).doc();
        await gameRef.set({
          ...gameData,
        });
        res.status(201).json({ message: "Game created successfully" });
      } catch (error) {
        console.error("Error creating game:", error.message);
        res.status(500).json({ error: "Error creating game." });
      }
    });
  });
});

export const fetchGameStats = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      const uid = req.user.uid;
      const userRecord = await admin.auth().getUser(uid);
      if (userRecord.customClaims.isCoach) {
        res.status(403).json({ error: "Coaches cannot fetch games." });
        return;
      }

      const mode = req.query.mode;
      if (!mode) {
        res.status(400).json({ error: "Missing mode parameter" });
        return;
      }

      let games = [];

      if (mode === "all") {
        try {
          const gamesSnapshot = await db.collection(`users/${uid}/games`).get();
          games = gamesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          res.status(200).json(games);
        } catch (error) {
          console.error("Error fetching games:", error.message);
          res.status(500).json({ error: "Error fetching games" });
        }
      }
    });
  });
});

export const fetchGame = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      try {
        const uid = req.user.uid;
        const userRecord = await admin.auth().getUser(uid);
        if (userRecord.customClaims.isCoach) {
          res.status(403).json({ error: "Coaches cannot fetch games." });
          return;
        }

        const gameId = req.query.gameId;
        if (!gameId) {
          res.status(400).json({ error: "Missing gameId parameter" });
          return;
        }

        const gameDoc = await db
          .collection(`users/${uid}/games`)
          .doc(gameId)
          .get();
        if (!gameDoc.exists) {
          res.status(404).json({ error: "Game not found" });
          return;
        }
        res.status(200).json({ id: gameDoc.id, ...gameDoc.data() });
      } catch (error) {
        console.error("Error fetching game:", error.message);
        res.status(500).json({ error: "Error fetching game." });
      }
    });
  });
});

export const deleteGame = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      try {
        const uid = req.user.uid;
        const userRecord = await admin.auth().getUser(uid);
        if (userRecord.customClaims.isCoach) {
          res.status(403).json({ error: "Coaches cannot delete games." });
          return;
        }
        const gameId = req.query.gameId;
        if (!gameId) {
          res.status(400).json({ error: "Missing gameId parameter" });
          return;
        }

        const gameDoc = await db
          .collection(`users/${uid}/games`)
          .doc(gameId)
          .get();
        if (!gameDoc.exists) {
          res.status(404).json({ error: "Game not found" });
          return;
        }

        await gameDoc.ref.delete();
        res.status(200).json({ message: "Game deleted successfully" });
      } catch (error) {
        console.error("Error deleting game:", error.message);
        res.status(500).json({ error: "Error deleting game." });
      }
    });
  });
});

export const updateGame = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      try {
        const uid = req.user.uid;
        const userRecord = await admin.auth().getUser(uid);
        if (userRecord.customClaims.isCoach) {
          res.status(403).json({ error: "Coaches cannot update games." });
          return;
        }

        const gameId = req.query.gameId;
        if (!gameId) {
          res.status(400).json({ error: "Missing gameId parameter" });
          return;
        }

        const gameDoc = await db
          .collection(`users/${uid}/games`)
          .doc(gameId)
          .get();
        if (!gameDoc.exists) {
          res.status(404).json({ error: "Game not found" });
          return;
        }

        const updatedData = req.body;
        if (validateGame(updatedData)) {
          res.status(400).json({ error: validateGame(updatedData) });
          return;
        }
        await gameDoc.ref.update(updatedData);
        res.status(200).json({ message: "Game updated successfully" });
      } catch (error) {
        console.error("Error updating game:", error.message);
        res.status(500).json({ error: "Error updating game." });
      }
    });
  });
});
