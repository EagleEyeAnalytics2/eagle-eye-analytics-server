import { admin } from "./admin.js";

const setCorsHeaders = (res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.set("Access-Control-Max-Age", "86400"); // 24 hours
};

export const handleCors = (req, res, handler) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).json({});
    return;
  }

  return handler(req, res);
};

export const withVerifiedId = async (req, res, handler) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) {
    res.status(401).json({ error: "Unauthorized: No Id Token" });
    return;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    return handler(req, res);
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid Id Token" });
  }
};

export const withVerifiedEmail = async (req, res, handler) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) {
    res.status(401).json({ error: "Unauthorized: No Id Token" });
    return;
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    if (!req.user.email_verified) {
      res.status(403).json({ error: "Email not verified" });
      return;
    }
    return handler(req, res);
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Unauthorized: Invalid Id Token" });
  }
};
