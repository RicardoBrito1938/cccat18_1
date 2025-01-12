import request from "supertest";
import crypto from "node:crypto";
import { app } from "../src/signup";
import { connection } from "../src/database";

type Account = {
  name: string;
  email: string;
  cpf: string;
  car_plate?: string;
};

// Helper function to generate unique test data
const generateTestData = (testId: string) => ({
  name: `John Doe ${testId}`,
  email: `john.doe${testId}@gmail.com`,
  cpf: "95818705552",
  password: "123456",
});

// Helper function to fetch an account from the database
const fetchAccountByEmail = async (
  email: string
): Promise<Account | undefined> => {
  const accounts = await connection.query<Account[]>(
    "SELECT * FROM ccca.account WHERE email = $1",
    [email]
  );
  return accounts[0];
};

describe("Signup API", () => {
  beforeAll(async () => {
    // Ensure database connection is initialized
    await connection.query(
      "CREATE TABLE IF NOT EXISTS ccca.account (account_id UUID PRIMARY KEY, name TEXT, email TEXT UNIQUE, cpf TEXT, car_plate TEXT, is_passenger BOOLEAN, is_driver BOOLEAN, password TEXT)"
    );
  });

  afterAll(async () => {
    // Close database connection
    await connection.$pool.end();
  });

  beforeEach(async () => {
    // Reset the table before each test
    await connection.query("DELETE FROM ccca.account");
  });

  test("Should create a passenger account", async () => {
    const testId = crypto.randomUUID();
    const input = {
      ...generateTestData(testId),
      isPassenger: true,
    };

    const response = await request(app).post("/signup").send(input);
    expect(response.status).toBe(200);
    expect(response.body.accountId).toBeDefined();

    const account = await fetchAccountByEmail(input.email);
    expect(account).toBeDefined();
    expect(account!.name).toBe(input.name);
    expect(account!.email).toBe(input.email);
    expect(account!.cpf).toBe(input.cpf);
  });

  test("Should create a driver account", async () => {
    const testId = crypto.randomUUID();
    const input = {
      ...generateTestData(testId),
      carPlate: "ABC1234",
      isDriver: true,
    };

    const response = await request(app).post("/signup").send(input);
    expect(response.status).toBe(200);
    expect(response.body.accountId).toBeDefined();

    const account = await fetchAccountByEmail(input.email);
    expect(account).toBeDefined();
    expect(account!.car_plate).toBe(input.carPlate);
  });

  test("Should not create account with invalid name", async () => {
    const testId = crypto.randomUUID();
    const input = {
      ...generateTestData(testId),
      name: "John", // Missing last name
    };

    const response = await request(app).post("/signup").send(input);
    expect(response.status).toBe(422);
    expect(response.body.message).toBe(-3);
  });

  test("Should not create account with invalid email", async () => {
    const testId = crypto.randomUUID();
    const input = {
      ...generateTestData(testId),
      email: "john.doe@", // Invalid email
    };

    const response = await request(app).post("/signup").send(input);
    expect(response.status).toBe(422);
    expect(response.body.message).toBe(-2);
  });

  test("Should not create account with invalid CPF", async () => {
    const testId = crypto.randomUUID();
    const input = {
      ...generateTestData(testId),
      cpf: "95818705553", // Invalid CPF
    };

    const response = await request(app).post("/signup").send(input);
    expect(response.status).toBe(422);
    expect(response.body.message).toBe(-1);
  });

  test("Should not create driver account with invalid car plate", async () => {
    const testId = crypto.randomUUID();
    const input = {
      ...generateTestData(testId),
      carPlate: "ABC123", // Invalid plate format
      isDriver: true,
    };

    const response = await request(app).post("/signup").send(input);
    expect(response.status).toBe(422);
    expect(response.body.message).toBe(-5);
  });

  test("Should not create account with existing email", async () => {
    const testId = crypto.randomUUID();
    const input = generateTestData(testId);

    // Create first account
    await request(app).post("/signup").send(input);

    // Try to create second account with the same email
    const response = await request(app).post("/signup").send(input);
    expect(response.status).toBe(422);
    expect(response.body.message).toBe(-4);
  });
});
