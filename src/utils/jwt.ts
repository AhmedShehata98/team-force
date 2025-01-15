import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET_KEY;

export function generateToken(payload: object): string {
  const token = jwt.sign(payload, SECRET_KEY as string, {
    expiresIn: "8h",
    algorithm: "HS256",
  });

  return token;
}

export function verifyToken(token: string): object | null {
  const verified = jwt.verify(token, SECRET_KEY as string);

  return typeof verified === "string" ? null : verified;
}
