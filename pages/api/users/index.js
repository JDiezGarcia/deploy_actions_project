import { usersRepo } from "helpers/users-repo";

export default handler;

function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getUsers();
    case 'POST0':
      return createUser();
    default:
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    case 'DELETE':
      return deleteAllUsers();

  }

  function getUsers() {
    const users = usersRepo.getAll();
    return res.status(200).json(users);
  }

  function createUser() {
    try {
      usersRepo.create(req.body);
      let newUserName = req.body.name;
      return res.status(200).json({ greeting: `Hello ${newUserName}` });
    } catch (error) {
      return res.status(400).json({ message: error });
    }
  }

  function deleteAllUsers() {
    usersRepo.deleteAllUsers();
    return res.status(200).json({ message: "All users deleted" });
  }
}
