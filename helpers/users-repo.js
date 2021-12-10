const fs = require("fs");

let users = require("data/users.json");

export const usersRepo = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
  deleteAllUsers,
};

function getAll() {
  return users;
}

function getById(id) {
  return users.find((x) => x.id.toString() === id.toString());
}

function create({ name, lastName, email }) {
  const user = { name, lastName, email };
  console.log(user);
  // validate
  if (users.find((x) => x.email === user.email))
    throw `Ya existe un usuario con el email ${user.email}`;

  // generate new user id
  user.id = users.length ? Math.max(...users.map((x) => x.id)) + 1 : 1;

  // add and save user
  users.push(user);
  saveData();
}

function update(id, { name, lastName, email }) {
  const params = { name, lastName, email };
  const user = users.find((x) => x.id.toString() === id.toString());

  // validate
  if (
    params.email !== user.email &&
    users.find((x) => x.email === params.email)
  )
    throw `Ya existe un usuario con el email ${user.email}`;

  // update and save
  Object.assign(user, params);
  saveData();
}

// prefixed with underscore '_' because 'delete' is a reserved word in javascript
function _delete(id) {
  // filter out deleted user and save
  users = users.filter((x) => x.id.toString() !== id.toString());
  saveData();
}

function deleteAllUsers() {
  users = [];
  saveData();
}

// private helper functions

function saveData() {
  fs.writeFileSync("data/users.json", JSON.stringify(users, null, 4));
}
