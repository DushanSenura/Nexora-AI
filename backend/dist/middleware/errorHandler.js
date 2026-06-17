import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";
export const errorHandler = (error, _req, res, _next) => {
    if (error instanceof HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof ZodError) {
        res.status(400).json({ message: error.errors[0]?.message ?? "Invalid request" });
        return;
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
};
