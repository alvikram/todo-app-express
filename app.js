const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => [
      console.log("Server is running at http://localhost:3000/"),
    ]);
  } catch (error) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

//API1-Scenario 1

app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  let data = null;
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo
        WHERE 
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';
        `;
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;

    default:
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
        `;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//API-2-Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE
            id = '${todoId}';
    `;
  const todoArray = await db.get(getSpecificTodoQuery);

  response.send(todoArray);
});

//API3-Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const todoItem = request.body;
  const { id, todo, priority, status } = todoItem;
  const addTodoItemQuery = `
        INSERT INTO  todo (id, todo, priority, status)
        VALUES (
                '${id}',
                '${todo}',
                '${priority}',
                '${status}'
        )
    `;

  const addTodoItem = await db.run(addTodoItemQuery);
  response.send("Todo Successfully Added");
});

//API-4-Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const previousTodoQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE
            id = '${todoId}';
    `;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
        todo
    SET
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    WHERE
        id = ${todoId};
  `;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API-5-Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM todo
        WHERE id = '${todoId}';
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
