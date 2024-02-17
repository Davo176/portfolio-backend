import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401); // No token provided

  jwt.verify(
    token,
    `${process.env.JWT_SIGNING_KEY}`,
    { maxAge: "1h" },
    (err) => {
      if (err) return res.sendStatus(403); // Invalid token
      next();
    }
  );
};

export { authenticateToken };
