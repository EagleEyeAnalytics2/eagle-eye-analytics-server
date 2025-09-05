import { onRequest } from "firebase-functions/v2/https";
import { admin, db } from "./admin.js";
import { handleCors, withVerifiedEmail } from "./wrappers.js";

const isValidEmail = (email) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

export const createUser = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    let { email, password, firstName, lastName, isCoach } = req.body;
    const missingFields = [];
    if (!email) missingFields.push("Email");
    if (!password) missingFields.push("Password");
    if (!firstName) missingFields.push("First Name");
    if (!lastName) missingFields.push("Last Name");
    if (isCoach === undefined) missingFields.push("Is Coach");

    if (missingFields.length > 0) {
      return res
        .status(400)
        .send("Missing required fields: " + missingFields.join(", "));
    }

    const invalidTypes = [];
    if (typeof email !== "string") invalidTypes.push("Email");
    if (typeof password !== "string") invalidTypes.push("Password");
    if (typeof firstName !== "string") invalidTypes.push("First Name");
    if (typeof lastName !== "string") invalidTypes.push("Last Name");
    if (typeof isCoach !== "boolean") invalidTypes.push("Is Coach");

    if (invalidTypes.length > 0) {
      return res
        .status(400)
        .send("Invalid types for fields: " + invalidTypes.join(", "));
    }

    email = email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).send("Invalid email format.");
    }

    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      if (existingUser) {
        return res.status(400).send("Email already exists.");
      }
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        return res.status(500).send("Error checking email existence.");
      }
    }

    if (password.length < 6) {
      return res.status(400).send("Password must be at least 6 characters.");
    }

    const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).send("Password contains invalid characters.");
    }

    firstName = firstName.trim();
    lastName = lastName.trim();

    if (firstName.length < 1) {
      return res.status(400).send("First Name must be at least 1 character.");
    }

    if (lastName.length < 1) {
      return res.status(400).send("Last Name must be at least 1 character.");
    }

    const nameRegex = /^[A-Za-z]+$/;
    if (!nameRegex.test(firstName)) {
      return res.status(400).send("First Name must contain only letters.");
    }
    if (!nameRegex.test(lastName)) {
      return res.status(400).send("Last Name must contain only letters.");
    }

    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);

    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        disabled: false,
      });

      let folderPath = "users";
      if (isCoach) folderPath = "coaches";

      await db
        .collection(folderPath)
        .doc(userRecord.uid)
        .set({
          id: userRecord.uid,
          email,
          firstName,
          lastName,
          classes: [],
          joined: new Date().getTime() / 1000,
        });

      res.status(201).send("User created successfully.");
    } catch (error) {
      res.status(500).send(`Error creating user. ${error.message}`);
    }
  });
});

export const fetchUserData = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      const uid = req.user.uid;
      try {
        let userDoc = await db.collection("users").doc(uid).get();
        let isCoach = false;

        if (!userDoc.exists) {
          userDoc = await db.collection("coaches").doc(uid).get();
          if (!userDoc.exists) {
            return res.status(404).send("User not found.");
          }
          isCoach = true;
        }

        const userData = userDoc.data();
        userData.isCoach = isCoach;
        res.status(200).json(userData);
      } catch (error) {
        res.status(500).send(`Error fetching user data. ${error.message}`);
      }
    });
  });
});

export const deleteUser = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      const uid = req.user.uid;
      try {
        await admin.auth().deleteUser(uid);
        await db.collection("users").doc(uid).delete();
        await db.collection("coaches").doc(uid).delete();
        res.status(200).send("User deleted successfully.");
      } catch (error) {
        res.status(500).send(`Error deleting user. ${error.message}`);
      }
    });
  });
});
