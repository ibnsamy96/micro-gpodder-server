const { MongoClient } = require("mongodb");

class DB {
  constructor(client) {
    this.client = client;
    this.db = client.db("gpodder");
    this.install();
  }

  async install() {
    const collections = await this.db.listCollections().toArray();
    if (!collections.find((c) => c.name === "users")) {
      await this.db.createCollection("users");
    }
    if (!collections.find((c) => c.name === "devices")) {
      await this.db.createCollection("devices");
    }
    if (!collections.find((c) => c.name === "subscriptions")) {
      await this.db.createCollection("subscriptions");
    }
    if (!collections.find((c) => c.name === "updates")) {
      await this.db.createCollection("updates");
    }
    if (!collections.find((c) => c.name === "episodes")) {
      await this.db.createCollection("episodes");
    }
  }

  prepare(collection, query) {
    return async (...params) => {
      const result = await this.db.collection(collection).find(query, ...params);
      return result.toArray();
    };
  }

  async simple(collection, query, ...params) {
    const result = await this.db.collection(collection).find(query, ...params);
    return result.toArray();
  }

  async firstRow(collection, query, ...params) {
    const result = await this.db.collection(collection).findOne(query, ...params);
    return result;
  }

  async firstColumn(collection, query, ...params) {
    const result = await this.db.collection(collection).findOne(query, ...params);
    return result ? Object.values(result)[0] : null;
  }

  async rowsFirstColumn(collection, query, ...params) {
    const result = await this.db.collection(collection).find(query, ...params);
    const documents = await result.toArray();
    return documents.map((doc) => Object.values(doc)[0]);
  }

  async iterate(collection, query, ...params) {
    const result = await this.db.collection(collection).find(query, ...params);
    const documents = await result.toArray();
    for (const doc of documents) {
      yield doc;
    }
  }

  async all(collection, query, ...params) {
    const result = await this.db.collection(collection).find(query, ...params);
    return result.toArray();
  }
}

const client = new MongoClient("mongodb://localhost:27017");
client.connect((err) => {
  if (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
  const db = new DB(client);
});
