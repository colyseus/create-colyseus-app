const { auth } = require("@colyseus/auth");

/**
 * Where the auth endpoints live, as seen from the browser. The email links
 * (confirmation, password reset) are built from it.
 */
auth.backend_url = process.env.BACKEND_URL ?? "http://localhost:2567";

/**
 * An in-memory stand-in so sign-in works on the first run. Every user is lost
 * when the process restarts — swap these three callbacks for real queries
 * before deploying. (@colyseus/database gives you them for free.)
 */
const users = [];

auth.settings.onFindUserByEmail = async function (email) {
  return users.find((user) => user.email === email);
};

auth.settings.onRegisterWithEmailAndPassword = async function (email, password, options) {
  const user = { id: `user_${users.length + 1}`, email, password, ...options };
  users.push(user);
  return user;
};

auth.settings.onRegisterAnonymously = async function (options) {
  // Anonymous users never log in by email, so the password is never compared.
  const user = { id: `anon_${users.length + 1}`, password: "", anonymous: true, ...options };
  users.push(user);
  return user;
};

/* @colyseus:auth:providers */
