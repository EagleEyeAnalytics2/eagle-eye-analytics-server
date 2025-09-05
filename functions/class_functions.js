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
      const uid = req.user.uid;
      const coachDoc = await db.collection("coaches").doc(uid).get();
      if (!coachDoc.exists) {
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

      try {
        await db.collection("classes").doc(classCode).set(newClass);
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

        const coachDoc = await db.collection("coaches").doc(uid).get();
        if (!coachDoc.exists) {
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
      const uid = req.user.uid;
      const classId = req.query.classId;
      if (!classId || classId.trim() === "") {
        res.status(400).json({ error: "Class ID is required." });
        return;
      }
      const classDoc = await db.collection("classes").doc(classId).get();
      if (!classDoc.exists) {
        res.status(404).json({ error: "Class not found." });
        return;
      }
      const classData = classDoc.data();
      if (classData.coach !== uid) {
        res.status(403).json({ error: "User is not the coach of this class." });
        return;
      }
      try {
        await db.collection("classes").doc(classId).delete();
        res.status(200).json({ message: "Class deleted successfully." });
      } catch (error) {
        console.error("Error deleting class:", error.message);
        res.status(500).json({ error: "Error deleting class." });
      }
    });
  });
});
