## JS Online Compiler – Rooms + Admin Problems

This project is a simple in-browser JavaScript playground with Rooms and an optional Admin workflow to create algorithm problems. Each Room can include:

- Metadata (name, group, author)
- Problem definition (title, description, difficulty, function name, starter code)
- Test cases to validate solutions

Users can write code in the browser and run it locally. They can also run tests (submitted to the server) which are executed in a small Node.js sandbox.

### Run Locally

Prerequisites: Node.js

1. Install dependencies
   - `npm install`
2. Start both client and server
   - `npm run dev`

The server runs on http://localhost:4000 and the client on http://localhost:5173 by default.

### Admin setup

- By default, if no admin is set in `server/data/users.json`, the first user in that file is treated as a temporary admin (bootstrap) and can create Rooms.
- Alternatively, set the environment variable `ADMIN_EMAILS` (comma-separated emails) when starting the server. Matching accounts will be treated as admins.
  - Example (PowerShell):
    - `$env:ADMIN_EMAILS="admin@example.com,test@test"; npm run dev`

Only admins see the “CREATE” button on the Rooms page and can create rooms with problem definitions and test cases.

### Problem contract (JavaScript)

- The problem must specify a `functionName` (default `solve`). The user’s code should define this function.
- Tests are an array of objects with `input` and `output`. `input` can be a single value or an array (mapped to function positional arguments). The server will execute:
  - `result = solve(...inputArray)` and compare with `output` using deep JSON equality.

### Notes

- This is an educational/demo project. The server sandbox uses Node’s `vm` module and is not hardened for untrusted code in production.
