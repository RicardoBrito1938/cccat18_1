import crypto from "node:crypto";
import express from "express";
import { validateCpf } from "./validateCpf";
import { connection } from "./database";

const INVALID_CAR_PLATE = -5;
const EMAIL_ALREADY_EXISTS = -4;
const INVALID_NAME = -3;
const INVALID_EMAIL = -2;
const INVALID_CPF = -1;

const validateName = (name: string) => {
  return name.match(/[a-zA-Z] [a-zA-Z]+/);
};

const validateEmail = (email: string) => {
  return email.match(/^(.+)@(.+)$/);
};

const validateDriverCarPlate = (carPlate: string) => {
  return carPlate.match(/[A-Z]{3}[0-9]{4}/);
};

const queryAccountByEmail = async (email: string) => {
  const [acc] = await connection.query(
    "SELECT * FROM ccca.account WHERE email = $1",
    [email]
  );
  return acc;
};

type Account = {
  id: string;
  name: string;
  email: string;
  cpf: string;
  carPlate: string;
  isPassenger: boolean;
  isDriver: boolean;
  password: string;
};

const insertAccount = async (newAccount: Account) => {
  const { id, name, email, cpf, carPlate, isPassenger, isDriver, password } =
    newAccount;
  await connection.query(
    "INSERT INTO ccca.account (account_id, name, email, cpf, car_plate, is_passenger, is_driver, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [id, name, email, cpf, carPlate, !!isPassenger, !!isDriver, password]
  );
};

export const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const { name, email, cpf, carPlate, isPassenger, isDriver, password } =
    req.body;

  try {
    const acc = await queryAccountByEmail(email);
    if (acc) return res.status(422).json({ message: EMAIL_ALREADY_EXISTS }); // already exists

    if (!validateName(name))
      return res.status(422).json({ message: INVALID_NAME });
    if (!validateEmail(email))
      return res.status(422).json({ message: INVALID_EMAIL });
    if (!validateCpf(cpf))
      return res.status(422).json({ message: INVALID_CPF });
    if (isDriver && !validateDriverCarPlate(carPlate))
      return res.status(422).json({ message: INVALID_CAR_PLATE });

    const id = crypto.randomUUID();

    await insertAccount({
      id,
      name,
      email,
      cpf,
      carPlate,
      isPassenger,
      isDriver,
      password,
    });

    res.json({ accountId: id });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
