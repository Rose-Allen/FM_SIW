const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // В реальной системе пароль нужно хешировать
  state: {
    type: String,
    enum: ["Not Authenticated", "Authenticated", "Blocked"],
    default: "Not Authenticated",
  },
  loginAttempts: { type: Number, default: 0 },
});

module.exports = mongoose.model("User", userSchema);
