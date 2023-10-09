const express = require("express");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const debug = require("debug")("api");
const { MongoClient } = require("mongodb");

class API {
  constructor(db) {
    this.db = db;
    this.router = express.Router();
    this.router.use(express.json());
    this.router.post("/auth", this.auth.bind(this));
    this.router.use(this.verifyToken.bind(this));
    this.router
      .route("/devices")
      .get(this.devices.bind(this))
      .post(this.devices.bind(this));
    this.router
      .route("/subscriptions")
      .get(this.subscriptions.bind(this))
      .post(this.subscriptions.bind(this))
      .put(this.subscriptions.bind(this));
    this.router.route("/updates").get(this.updates.bind(this));
    this.router
      .route("/episodes")
      .get(this.episodes.bind(this))
      .post(this.episodes.bind(this));
  }

  async auth(req, res, next) {
    try {
      const user = await this.db
        .collection("users")
        .findOne({ name: req.body.username });
      if (!user || user.password !== req.body.password) {
        throw createError(401, "Invalid username/password");
      }
      const token = jwt.sign({ id: user._id }, "secret", { expiresIn: "1h" });
      res.json({ token });
    } catch (err) {
      next(err);
    }
  }

  verifyToken(req, res, next) {
    const token = req.headers["x-access-token"];
    if (!token) {
      return next(createError(401, "No token provided"));
    }
    jwt.verify(token, "secret", (err, decoded) => {
      if (err) {
        return next(createError(401, "Failed to authenticate token"));
      }
      req.userId = decoded.id;
      next();
    });
  }

  async devices(req, res, next) {
    try {
      if (req.method === "GET") {
        const devices = await this.db
          .collection("devices")
          .find({ user: req.userId })
          .toArray();
        res.json(devices);
      } else if (req.method === "POST") {
        const device = req.body;
        device.user = req.userId;
        await this.db.collection("devices").insertOne(device);
        res.json(device);
      }
    } catch (err) {
      next(err);
    }
  }

  async subscriptions(req, res, next) {
    try {
      if (req.method === "GET") {
        const subscriptions = await this.db
          .collection("subscriptions")
          .find({ user: req.userId })
          .toArray();
        res.json(subscriptions);
      } else if (req.method === "POST" || req.method === "PUT") {
        const subscription = req.body;
        subscription.user = req.userId;
        await this.db
          .collection("subscriptions")
          .updateOne(
            { user: req.userId, url: subscription.url },
            { $set: subscription },
            { upsert: true },
          );
        res.json(subscription);
      }
    } catch (err) {
      next(err);
    }
  }

  async updates(req, res, next) {
    try {
      const updates = await this.db
        .collection("updates")
        .find({ user: req.userId })
        .toArray();
      res.json(updates);
    } catch (err) {
      next(err);
    }
  }

  async episodes(req, res, next) {
    try {
      if (req.method === "GET") {
        const episodes = await this.db
          .collection("episodes")
          .find({ user: req.userId })
          .toArray();
        res.json(episodes);
      } else if (req.method === "POST") {
        const episode = req.body;
        episode.user = req.userId;
        await this.db.collection("episodes").insertOne(episode);
        res.json(episode);
      }
    } catch (err) {
      next(err);
    }
  }
}

const client = new MongoClient("mongodb://localhost:27017");
client.connect((err) => {
  if (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
  const db = client.db("gpodder");
  const api = new API(db);
  const app = express();
  app.use("/api", api.router);
  app.use((err, req, res, next) => {
    debug(err.stack);
    res.status(err.status || 500);
    res.json({ message: err.message });
  });
  app.listen(3000, () => console.log("Server started on port 3000"));
});
