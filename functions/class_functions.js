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
