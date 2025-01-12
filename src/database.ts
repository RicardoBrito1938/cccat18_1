import pgp from "pg-promise";

const connectionString = "postgres://postgres:123456@localhost:5432/app";
const pgpInstance = pgp();
export const connection = pgpInstance(connectionString);
