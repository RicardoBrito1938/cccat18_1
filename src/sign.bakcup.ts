import crypto from "node:crypto";
import pgp from "pg-promise";
import express from "express";
import { validateCpf } from "./validateCpf";

const app = express();
app.use(express.json());

const validateName = (name: string) => name.match(/[a-zA-Z] [a-zA-Z]+/);
const validateEmail = (email: string) => email.match(/^(.+)@(.+)$/);

app.post("/signup", async (req, res) => {
  const input = req.body;
  const { name, email, cpf, isDriver, carPlate, isPassenger, password } = input;
  const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
  try {
    const id = crypto.randomUUID();
    let result;
    const [acc] = await connection.query(
      "select * from ccca.account where email = $1",
      [email]
    );
    if (acc) result = -4;

    if (!validateName(name)) result = -3;
    if (!validateEmail(email)) result = -2;
    if (!validateCpf(cpf)) result = -1;
    if (validateCpf(cpf) && !isDriver) {
      await connection.query(
        "insert into ccca.account (account_id, name, email, cpf, car_plate, is_passenger, is_driver, password) values ($1, $2, $3, $4, $5, $6, $7, $8)",
        [id, name, email, cpf, carPlate, !!isPassenger, !!isDriver, password]
      );

      const obj = {
        accountId: id,
      };
      result = obj;
    }

    if (carPlate.match(/[A-Z]{3}[0-9]{4}/)) {
      await connection.query(
        "insert into ccca.account (account_id, name, email, cpf, car_plate, is_passenger, is_driver, password) values ($1, $2, $3, $4, $5, $6, $7, $8)",
        [id, name, email, cpf, carPlate, !!isPassenger, !!isDriver, password]
      );

      const obj = {
        accountId: id,
      };
      result = obj;
    } else {
      // invalid car plate
      result = -5;
    }

    if (typeof result === "number") {
      res.status(422).json({ message: result });
    } else {
      res.json(result);
    }
  } finally {
    await connection.$pool.end();
  }
});

app.listen(3000);
