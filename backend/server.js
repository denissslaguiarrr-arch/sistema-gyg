const app = require("./app");
const { DB_PATH } = require("./db");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`GYG local escuchando en http://localhost:${PORT}`);
  console.log(`SQLite: ${DB_PATH}`);
});
