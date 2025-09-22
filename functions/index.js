import {
  onDocumentUpdated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import functions from "firebase-functions/v1";
import { FieldValue } from "firebase-admin/firestore";
import { admin, db } from "./admin.js";
import { handleCors, withVerifiedEmail, withVerifiedId } from "./wrappers.js";
import {
  createUser as createUserFunction,
  fetchUserData as fetchUserDataFunction,
  deleteUser as deleteUserFunction,
} from "./user_functions.js";
import {
  fetchGameStats as fetchGameStatsFunction,
  createGame as createGameFunction,
  fetchGame as fetchGameFunction,
  deleteGame as deleteGameFunction,
  updateGame as updateGameFunction,
} from "./game_functions.js";
import {
  createClass as createClassFunction,
  fetchCoachClasses as fetchCoachClassesFunction,
  deleteClass as deleteClassFunction,
  createClassRequest as createClassRequestFunction,
  fetchPendingClassRequests as fetchPendingClassRequestsFunction,
  deleteClassRequest as deleteClassRequestFunction,
  coachFetchClassRequests as coachFetchClassRequestsFunction,
} from "./class_functions.js";

export const createUser = createUserFunction;
export const fetchUserData = fetchUserDataFunction;
export const deleteUser = deleteUserFunction;

export const fetchGameStats = fetchGameStatsFunction;
export const createGame = createGameFunction;
export const fetchGame = fetchGameFunction;
export const deleteGame = deleteGameFunction;
export const updateGame = updateGameFunction;

export const createClass = createClassFunction;
export const fetchCoachClasses = fetchCoachClassesFunction;
export const deleteClass = deleteClassFunction;
export const createClassRequest = createClassRequestFunction;
export const fetchPendingClassRequests = fetchPendingClassRequestsFunction;
export const deleteClassRequest = deleteClassRequestFunction;
export const coachFetchClassRequests = coachFetchClassRequestsFunction;

export const verifyId = onRequest((req, res) => {
  withVerifiedId(req, res, async () => {
    const { uid, email, name, email_verified } = req.user;
    res.status(200).json({ uid, email, name, email_verified });
  });
});

export const verifyEmail = onRequest((req, res) => {
  withVerifiedEmail(req, res, async () => {
    const { uid, email, name, email_verified } = req.user;
    res.status(200).json({ uid, email, name, email_verified });
  });
});

export const updateClassToStudents = onDocumentUpdated(
  "/classes/{classId}",
  async (event) => {
    const classId = event.params.classId;
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Get the students arrays before and after the update
    const beforeStudents = beforeData.students || [];
    const afterStudents = afterData.students || [];

    // Identify newly added students
    const addedStudentIds = afterStudents.filter(
      (studentId) => !beforeStudents.includes(studentId)
    );

    // Itentify students that were removed
    const removedStudentIds = beforeStudents.filter(
      (studentId) => !afterStudents.includes(studentId)
    );

    // Add the class ID to each new student's 'classes' array
    const additions = addedStudentIds.map(async (studentId) => {
      const studentRef = db.collection("users").doc(studentId);
      await studentRef.update({
        classes: FieldValue.arrayUnion(classId),
      });
    });

    // Remove the class ID from each removed student's 'classes' array
    const removals = removedStudentIds.map(async (studentId) => {
      const studentRef = db.collection("users").doc(studentId);
      await studentRef.update({
        classes: FieldValue.arrayRemove(classId),
      });
    });

    // Execute all updates
    await Promise.all(additions);
    await Promise.all(removals);

    if (addedStudentIds.length > 0)
      console.log(
        `Added class ${classId} to students: ${addedStudentIds.join(", ")}`
      );
    if (removedStudentIds.length > 0)
      console.log(
        `Removed class ${classId} from students: ${removedStudentIds.join(
          ", "
        )}`
      );
  }
);

export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;
  const userRef = db.collection("users").doc(userId);
  const userSnapshot = await userRef.get();
  if (userSnapshot.exists) {
    const userData = userSnapshot.data();
    const classIds = userData.classes || [];
    const updates = classIds.map(async (classId) => {
      const classRef = db.collection("classes").doc(classId);
      await classRef.update({
        students: FieldValue.arrayRemove(userId),
      });
    });
    await Promise.all(updates);
    await userRef.delete();
    console.log(
      `Deleted user ${userId} and removed from classes: ${classIds.join(", ")}`
    );
    return;
  }
  const coachRef = db.collection("coaches").doc(userId);
  const coachSnapshot = await coachRef.get();
  if (coachSnapshot.exists) {
    const classesSnapshot = await db
      .collection("classes")
      .where("coach", "==", userId)
      .get();

    const classDeletions = classesSnapshot.docs.map(async (classDoc) => {
      const classId = classDoc.id;
      const classRef = db.collection("classes").doc(classId);
      await classRef.delete();
      console.log(`Deleted class ${classId} for coach ${userId}`);
    });

    await Promise.all(classDeletions);
    await coachRef.delete();
    console.log(`Deleted coach ${userId}`);
    return;
  }
  console.log("No user exists");
});

export const removeStudentFromClass = onDocumentUpdated(
  "/users/{userId}",
  async (event) => {
    const userId = event.params.userId;
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Get the classes arrays before and after the update
    const beforeClasses = beforeData.classes || [];
    const afterClasses = afterData.classes || [];

    // Identify classes that the student was removed from
    const removedClassIds = beforeClasses.filter(
      (classId) => !afterClasses.includes(classId)
    );

    // Remove the student ID from each removed class's 'students
    const updates = removedClassIds.map(async (classId) => {
      const classRef = db.collection("classes").doc(classId);
      try {
        await classRef.update({
          students: FieldValue.arrayRemove(userId),
        });
      } catch (error) {
        console.log("Error trying to update class " + classId);
        console.log(error);
      }
    });

    // Execute all updates
    await Promise.all(updates);
    if (removedClassIds.length > 0) {
      console.log(
        `Removed student ${userId} from classes: ${removedClassIds.join(", ")}`
      );
    }
  }
);

export const onClassDelete = onDocumentDeleted(
  "/classes/{classId}",
  async (event) => {
    const classId = event.params.classId;
    const studentsSnapshot = await db
      .collection("users")
      .where("classes", "array-contains", classId)
      .get();

    const updates = studentsSnapshot.docs.map(async (studentDoc) => {
      const studentRef = db.collection("users").doc(studentDoc.id);
      await studentRef.update({
        classes: FieldValue.arrayRemove(classId),
      });
    });
    await Promise.all(updates);
    console.log(`Removed class ${classId} from students`);
  }
);

export const fetchAssignments = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    try {
      const userId = req.query.id;
      if (!userId) {
        return res.status(400).send("User ID is required");
      }

      const userRef = db.collection("users").doc(userId);
      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        return res.status(404).send("User not found.");
      }

      const classes = userSnapshot.data().classes;
      const assignments = [];

      for (const classId of classes) {
        const classRef = db.collection("classes").doc(classId);
        const classSnapshot = await classRef.get();

        if (classSnapshot.exists) {
          const assignmentsSnapshot = await classRef
            .collection("assignments")
            .get();

          assignmentsSnapshot.forEach((assignmentDoc) => {
            const assignmentData = assignmentDoc.data();
            if (assignmentData.students.includes(userId)) {
              assignments.push(
                Object.assign({ id: assignmentDoc.id }, assignmentData)
              );
            }
          });
        }
      }

      res.status(200).json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});

export const markAssignmentCompleted = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    try {
      const userId = req.query.id;
      if (!userId) {
        return res.status(400).send("User ID is required");
      }
      const assignmentId = req.query.assignmentId;
      if (!assignmentId) {
        return res.status(400).send("Assignment ID is required");
      }
      const timeStamp = req.query.timeStamp;
      if (!timeStamp) {
        return res.status(400).send("Timestamp is required");
      }

      const userRef = db.collection("users").doc(userId);
      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        return res.status(404).send("User not found.");
      }

      const classes = userSnapshot.data().classes;

      let foundAssignment = false;

      for (const classId of classes) {
        const classRef = db.collection("classes").doc(classId);
        const classSnapshot = await classRef.get();

        if (classSnapshot.exists) {
          const assignmentsSnapshot = await classRef
            .collection("assignments")
            .get();

          const tasks = assignmentsSnapshot.docs.map(async (assignmentDoc) => {
            const assignmentData = assignmentDoc.data();
            if (
              assignmentDoc.id === assignmentId &&
              assignmentData.students.includes(userId)
            ) {
              foundAssignment = true;
              const assignmentRef = classRef
                .collection("assignments")
                .doc(assignmentId);
              assignmentRef.update({
                completed: FieldValue.arrayUnion({
                  userId,
                  timeStamp,
                }),
              });
            }
          });
          await Promise.all(tasks);
        }
      }
      if (!foundAssignment) {
        return res.status(404).send("Assignment not found.");
      } else return res.status(200).send("Assignment Marked As Completed");
    } catch (error) {
      console.error("Error fetching assignments:", error);
      return res.status(500).send("Internal Server Error");
    }
  });
});

export const coachRemoveStudentFromClass = onRequest((req, res) => {
  return handleCors(req, res, async (req, res) => {
    try {
      const userId = req.query.id;
      if (!userId) {
        return res.status(400).send("User ID is required");
      }
      const classId = req.query.classId;
      if (!classId) {
        return res.status(400).send("Class ID is required");
      }

      const userRef = db.collection("users").doc(userId);
      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        return res.status(404).send("User not found.");
      }

      const classes = userSnapshot.data().classes;

      if (!classes.includes(classId)) {
        return res.status(404).send("User is not enrolled in this class.");
      }

      const classRef = db.collection("classes").doc(classId);
      const classSnapshot = await classRef.get();

      if (!classSnapshot.exists) {
        return res.status(404).send("Class not found.");
      }

      await userRef.update({
        classes: FieldValue.arrayRemove(classId),
      });
      await classRef.update({
        students: FieldValue.arrayRemove(userId),
      });

      res.status(200).send("Student removed from class successfully.");
    } catch (error) {
      console.error("Error removing student from class:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});
