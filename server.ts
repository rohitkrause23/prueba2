import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const app = express();
app.use(express.json());

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok",
    supabaseConfigured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY,
    vercel: !!process.env.VERCEL
  });
});

// Auth API
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*, branches(name)")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error) return res.status(401).json({ error: "Credenciales inválidas" });
    if (user) {
      res.json({ ...user, branch_name: (user as any).branches?.name });
    } else {
      res.status(401).json({ error: "Credenciales inválidas" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

// Clients API
app.get("/api/clients", async (req, res) => {
  const { data, error } = await supabase.from("clients").select("*").order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/clients", async (req, res) => {
  const { name, phone, whatsapp, address, city, type, source } = req.body;
  const { data, error } = await supabase.from("clients").insert([{ name, phone, whatsapp, address, city, type, source }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data[0].id });
});

// Products API
app.get("/api/products", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Orders API
app.get("/api/orders", async (req, res) => {
  const { branch_id, status } = req.query;
  let query = supabase.from("orders").select("*, clients(name), users(role)").order("created_at", { ascending: false });
  if (branch_id) query = query.eq("branch_id", branch_id);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(o => ({ ...o, client_name: (o as any).clients?.name, user_name: (o as any).users?.role })));
});

app.get("/api/orders/:id", async (req, res) => {
  const { data: order, error: orderErr } = await supabase.from("orders").select("*, clients(name)").eq("id", req.params.id).single();
  if (orderErr) return res.status(500).json({ error: orderErr.message });
  const { data: items } = await supabase.from("order_items").select("*, products(name)").eq("order_id", req.params.id);
  const { data: payments } = await supabase.from("payments").select("*").eq("order_id", req.params.id);
  res.json({ ...order, client_name: (order as any).clients?.name, items: items?.map(i => ({ ...i, product_name: (i as any).products?.name })), payments });
});

app.post("/api/orders", async (req, res) => {
  const { client_id, user_id, branch_id, status, priority, delivery_mode, total, items } = req.body;
  const { data: order, error: orderErr } = await supabase.from("orders").insert([{ client_id, user_id, branch_id, status, priority, delivery_mode, total }]).select().single();
  if (orderErr) return res.status(500).json({ error: orderErr.message });
  const orderId = order.id;
  const itemsToInsert = items.map((item: any) => ({ order_id: orderId, product_id: item.product_id, quantity: item.quantity, unit_price: item.unit_price, subtotal: item.subtotal, production_status: 'Pendiente' }));
  await supabase.from("order_items").insert(itemsToInsert);
  await supabase.from("audit_log").insert([{ user_id, action: 'Crear Pedido', details: `Pedido #${orderId}` }]);
  res.json({ id: orderId });
});

app.patch("/api/orders/:id/status", async (req, res) => {
  const { status, user_id } = req.body;
  await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", req.params.id);
  await supabase.from("audit_log").insert([{ user_id, action: 'Actualizar Estado', details: `Pedido #${req.params.id} a ${status}` }]);
  res.json({ success: true });
});

// Payments API
app.post("/api/payments", async (req, res) => {
  const { order_id, user_id, amount, type, method } = req.body;
  await supabase.from("payments").insert([{ order_id, user_id, amount, type, method }]);
  const { data: order } = await supabase.from("orders").select("paid").eq("id", order_id).single();
  await supabase.from("orders").update({ paid: (order?.paid || 0) + amount }).eq("id", order_id);
  res.json({ success: true });
});

// Expenses API
app.get("/api/expenses", async (req, res) => {
  const { branch_id } = req.query;
  let query = supabase.from("expenses").select("*, branches(name), users(role)").order("created_at", { ascending: false });
  if (branch_id) query = query.eq("branch_id", branch_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(e => ({ ...e, branch_name: (e as any).branches?.name, user_name: (e as any).users?.role })));
});

app.post("/api/expenses", async (req, res) => {
  const { branch_id, user_id, category, description, amount, method } = req.body;
  await supabase.from("expenses").insert([{ branch_id, user_id, category, description, amount, method }]);
  res.json({ success: true });
});

// Stats API
app.get("/api/stats", async (req, res) => {
  const { branch_id } = req.query;
  const today = new Date().toISOString().split('T')[0];
  let salesQuery = supabase.from("orders").select("total").gte("created_at", today);
  if (branch_id) salesQuery = salesQuery.eq("branch_id", branch_id);
  const { data: sales } = await salesQuery;
  const salesToday = sales?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;
  res.json({ salesToday, pendingOrders: 0, productionOrders: 0 });
});

// Branches API
app.get("/api/branches", async (req, res) => {
  const { data, error } = await supabase.from("branches").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Manejo de archivos estáticos (Vite solo en desarrollo)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// Solo escuchar en puerto si no estamos en Vercel
if (!process.env.VERCEL) {
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
