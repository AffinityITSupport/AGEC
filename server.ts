import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "GEC CMS API is running" });
  });

  // Mock data for members
  const members = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Member", joined: "2023-01-15" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Elder", joined: "2022-05-20" },
    { id: 3, name: "Robert Brown", email: "robert@example.com", role: "Deacon", joined: "2023-03-10" },
    { id: 4, name: "Sarah Wilson", email: "sarah@example.com", role: "Member", joined: "2023-06-05" },
  ];

  app.get("/api/members", (req, res) => {
    res.json(members);
  });

  // Mock data for finances
  const finances = {
    monthlyIncome: [
      { month: "Jan", amount: 4500 },
      { month: "Feb", amount: 5200 },
      { month: "Mar", amount: 4800 },
      { month: "Apr", amount: 6100 },
      { month: "May", amount: 5500 },
      { month: "Jun", amount: 6700 },
    ],
    stats: {
      totalTithes: 24500,
      totalExpenses: 12300,
      netSavings: 12200,
    }
  };

  app.get("/api/finances", (req, res) => {
    res.json(finances);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
