const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://simpleDBUser:fl2caF7rhPPqkDAs@cluster0.e5e52nd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    await client.connect();
    const database = client.db("taskmanager");
    const tasksCollection = database.collection("tasks");

    // Get all tasks
    app.get("/api/tasks", async (req, res) => {
      const tasks = await tasksCollection.find().toArray();
      res.send(tasks);
    });

    // Add a task
    app.post("/api/tasks", async (req, res) => {
      const { title, description, dueDate } = req.body;
      console.log(req.body); // include them
      const newTask = {
        title,
        description: description || "",
        dueDate: dueDate || "",
        completed: false,
      };
      const result = await tasksCollection.insertOne(newTask);
      res.send(result.ops ? result.ops[0] : newTask);
    });
    

    // Delete a task
    app.delete("/api/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Edit a task
    app.put("/api/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const { title, description, dueDate } = req.body;
      const updateFields = { title, description, dueDate };
      const result = await tasksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
      );
      res.send(result);
    });

    // Toggle completion
    app.patch("/api/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
      const result = await tasksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { completed: !task.completed } }
      );
      res.send(result);
    });
  } finally {
    // no cleanup needed here
  }
};

run().catch(console.dir);

app.listen(port, () => {
  console.log("Server running on port", port);
});
