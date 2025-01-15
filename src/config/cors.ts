import { CorsOptions } from "cors";

export const corsOptions: CorsOptions = {
  origin: ["http://localhost:3000"],
  methods: "GET,DELETE,PATCH,POST,PUT",
  credentials: true,
};

// origin: "http://localhost:3000", // Allow requests from this origin
// methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
// credentials: true,
