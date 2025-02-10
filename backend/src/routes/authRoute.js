import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import middlewareToken from "../middleware/authMiddleware";

const authRoutes = Router();
const prisma = new PrismaClient();

// endpoint Register
authRoutes.post("/register", async (request, response) => {
  const { name, email, password } = request.body;
  const hashedPassword = await bcrypt.hash(password, 8);

  if (!name || !email || !password) {
    return response
      .status(400)
      .json({ message: "Name, email and password are required" });
  }

  try {
    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    response.status(201).json({ message: "User created!" });
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

// endpoint Login
authRoutes.post("/login", async (request, response) => {
  const { email, password } = request.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!email || !password) {
    return response
      .status(400)
      .json({ message: "Email and password are required" });
  }

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return response.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { email: user.email, name: user.name },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );
  response.cookie("token", token, { httpOnly: true });
  response.json({ message: "Login successful", token });

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }
});

// endpoint Logout
authRoutes.post("/logout", middlewareToken, (request, response) => {
  response.clearCookie("token");
  response.json({ message: `${request.user.name} Logout successful` });
});

// Protected endpoint
authRoutes.get("/dashboard", middlewareToken, (request, response) => {
  response.json({ message: `Welcome ${request.user.name}` });
});

export default authRoutes;
