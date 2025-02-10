import jwt from "jsonwebtoken";

const middlewareToken = (request, response, next) => {
  const token = request.cookies.token;
  if (!token) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded;
    next();
  } catch (error) {
    return response.status(401).json({ message: "Invalid Token" });
  }
};

export default middlewareToken;
