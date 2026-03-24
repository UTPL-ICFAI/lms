const Notification = require("../models/Notification");

async function notifyUsers(userIds, message, type = "other") {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  const docs = userIds
    .filter(Boolean)
    .map((user) => ({ user, message, type, read: false }));
  if (docs.length === 0) return;
  await Notification.insertMany(docs);
}

module.exports = { notifyUsers };
