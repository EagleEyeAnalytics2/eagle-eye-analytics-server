import { onRequest } from "firebase-functions/v2/https";
import { admin, db } from "./admin.js";
import { handleCors, withVerifiedEmail } from "./wrappers.js";

function generateClassCode() {
  const code = Math.random().toString(36).substring(2, 8);
  return code.toUpperCase();
}

export const createClass = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      try {
        const uid = req.user.uid;
        const userRecord = await admin.auth().getUser(uid);
        if (!userRecord.customClaims.isCoach) {
          res.status(403).json({ error: "User is not a coach." });
          return;
        }
        const className = req.body.className;
        if (!className || className.trim() === "") {
          res.status(400).json({ error: "Class name is required." });
          return;
        }

        const classCode = generateClassCode();

        let codeExists = true;
        while (codeExists) {
          const existing = await db
            .collection("classes")
            .where("code", "==", classCode)
            .get();
          if (existing.empty) {
            codeExists = false;
          } else {
            classCode = generateClassCode();
          }
        }

        const newClass = {
          name: className.trim(),
          id: classCode,
          coach: uid,
          createdAt: new Date().getTime() / 1000,
          students: [],
        };

        await db.collection("classes").doc(classCode).set(newClass);

        const coachRef = db.collection("coaches").doc(uid);
        const coachDoc = await coachRef.get();
        if (coachDoc.exists) {
          const coachData = coachDoc.data();
          const updatedClasses = Array.isArray(coachData.classes)
            ? [...coachData.classes, classCode]
            : [classCode];
          await coachRef.update({ classes: updatedClasses });
        } else {
          console.log("Coach document does not exist:", uid);
          res.status(404).json({ error: "Coach document not found." });
          return;
        }

        res
          .status(201)
          .json({ message: "Class created successfully.", class: newClass });
      } catch (error) {
        console.error("Error creating class:", error.message);
        res.status(500).json({ error: "Error creating class." });
      }
    });
  });
});

export const fetchCoachClasses = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      try {
        const uid = req.user.uid;
        const userRecord = await admin.auth().getUser(uid);
        if (!userRecord.customClaims.isCoach) {
          res.status(403).json({ error: "User is not a coach." });
          return;
        }

        const classesSnapshot = await db
          .collection("classes")
          .where("coach", "==", uid)
          .get();

        const classes = classesSnapshot.docs.map((doc) => doc.data());
        res.status(200).json({ classes });
      } catch (error) {
        console.error("Error fetching coach classes:", error.message);
        res.status(500).json({ error: "Error fetching coach classes." });
      }
    });
  });
});

export const deleteClass = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      try {
        const uid = req.user.uid;
        const classCode = req.query.classCode;
        if (!classCode || classCode.trim() === "") {
          res.status(400).json({ error: "Class code is required." });
          return;
        }
        const classDoc = await db.collection("classes").doc(classCode).get();
        if (!classDoc.exists) {
          res.status(404).json({ error: "Class not found." });
          return;
        }
        const classData = classDoc.data();
        if (classData.coach !== uid) {
          res
            .status(403)
            .json({ error: "User is not the coach of this class." });
          return;
        }
        await db.collection("classes").doc(classCode).delete();
        res.status(200).json({ message: "Class deleted successfully." });
      } catch (error) {
        console.error("Error deleting class:", error.message);
        res.status(500).json({ error: "Error deleting class." });
      }
    });
  });
});

export const createClassRequest = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      try {
        const uid = req.user.uid;
        const userRecord = await admin.auth().getUser(uid);
        const displayName = userRecord.displayName;
        if (!displayName) {
          res.status(400).json({ error: "User display name is not set." });
          return;
        }

        if (userRecord.customClaims.isCoach) {
          res.status(403).json({ error: "Coaches cannot join classes." });
          return;
        }

        const classCode = req.body.classCode;
        if (!classCode || classCode.trim() === "") {
          res.status(400).json({ error: "Class code is required." });
          return;
        }

        const classDoc = await db.collection("classes").doc(classCode).get();
        if (!classDoc.exists) {
          res.status(404).json({ error: "Class not found." });
          return;
        }

        if (classDoc.data().students.includes(uid)) {
          res.status(400).json({ error: "User already in class." });
          return;
        }

        const existingRequest = await db
          .collection("classes")
          .doc(classCode)
          .collection("requests")
          .doc(uid)
          .get();

        if (existingRequest.exists) {
          res.status(400).json({ error: "Join request already submitted." });
          return;
        }

        await db
          .collection("classes")
          .doc(classCode)
          .collection("requests")
          .doc(uid)
          .set({
            uid,
            displayName,
            timeRequested: new Date().getTime() / 1000,
          });

        res.status(200).json({ message: "Class join request submitted." });
      } catch (error) {
        console.error(
          "Error processing class creation request:",
          error.message
        );
        res
          .status(500)
          .json({ error: "Error processing class creation request." });
      }
    });
  });
});

export const fetchPendingClassRequests = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      try {
        const uid = req.user.uid;
        const userRecord = await admin.auth().getUser(uid);

        if (userRecord.customClaims.isCoach) {
          res.status(403).json({ error: "User is not a student." });
          return;
        }

        const requestsSnapshot = await db
          .collectionGroup("requests")
          .where("uid", "==", uid)
          .get();

        const requests = requestsSnapshot.docs.map((doc) => {
          const classCode = doc.ref.parent.parent.id;
          return {
            classCode,
            ...doc.data(),
          };
        });

        res.status(200).json({ requests });
      } catch (error) {
        console.error("Error fetching user class requests:", error.message);
        res.status(500).json({ error: "Error fetching user class requests." });
      }
    });
  });
});

export const deleteClassRequest = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      try {
        const uid = req.user.uid;
        const classCode = req.query.classCode;

        if (!classCode) {
          res.status(400).json({ error: "Class code is required." });
          return;
        }

        const userRecord = await admin.auth().getUser(uid);
        if (userRecord.customClaims.isCoach) {
          res.status(403).json({ error: "User is not a student." });
          return;
        }

        const requestRef = db
          .collection("classes")
          .doc(classCode)
          .collection("requests")
          .doc(uid);

        const requestSnapshot = await requestRef.get();
        if (!requestSnapshot.exists) {
          res.status(404).json({ error: "Class request not found." });
          return;
        }

        await requestRef.delete();
        res
          .status(200)
          .json({ message: "Class request deleted successfully." });
      } catch (error) {
        console.error("Error deleting class request:", error.message);
        res.status(500).json({ error: "Error deleting class request." });
      }
    });
  });
});

export const coachFetchClassRequests = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    return withVerifiedEmail(req, res, async (req, res) => {
      try {
        const uid = req.user.uid;
        const userRecord = await admin.auth().getUser(uid);
        if (!userRecord.customClaims.isCoach) {
          res.status(403).json({ error: "User is not a coach." });
          return;
        }

        const classCode = req.query.classCode;

        if (!classCode) {
          res.status(400).json({ error: "Class code is required." });
          return;
        }

        const classDoc = await db.collection("classes").doc(classCode).get();
        if (!classDoc.exists) {
          res.status(404).json({ error: "Class not found." });
          return;
        }

        if (classDoc.data().coach !== uid) {
          res
            .status(403)
            .json({ error: "User is not the coach of this class." });
          return;
        }

        const requestsSnapshot = await db
          .collection("classes")
          .doc(classCode)
          .collection("requests")
          .get();

        const requests = requestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        res.status(200).json({ requests });
      } catch (error) {
        console.error("Error fetching class requests:", error.message);
        res.status(500).json({ error: "Error fetching class requests." });
      }
    });
  });
});
