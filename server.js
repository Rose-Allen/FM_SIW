const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./User");

const app = express();
app.use(bodyParser.json());

mongoose.connect("mongodb://localhost:27017/access_control", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Регистрация пользователя
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: "User already exists or invalid data" });
  }
});

// Авторизация пользователя
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.state === "Blocked") {
      return res.status(403).json({ error: "Access Denied: User is blocked" });
    }

    if (user.password === password) {
      user.state = "Authenticated";
      user.loginAttempts = 0;
      await user.save();
      return res.status(200).json({ message: "Access Granted" });
    } else {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 3) {
        user.state = "Blocked";
      }
      await user.save();
      return res
        .status(401)
        .json({ error: "Access Denied: Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Выход из системы
app.post("/logout", async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || user.state !== "Authenticated") {
      return res.status(400).json({ error: "No active session to log out" });
    }
    user.state = "Not Authenticated";
    await user.save();
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Получение состояния пользователя
app.get("/user/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ state: user.state });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
