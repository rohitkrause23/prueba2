import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL ERROR: Supabase environment variables are missing!");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const app = express();

async function createServer() {
  app.use(express.json());

  // Check for configuration
  app.use((req, res, next) => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      if (req.path.startsWith("/api/")) {
        return res.status(500).json({ 
          error: "Configuración de Supabase faltante. Por favor, añade SUPABASE_URL y SUPABASE_ANON_KEY en los Secrets de AI Studio." 
        });
      }
    }
    next();
  });

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      supabaseConfigured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY,
      env: process.env.NODE_ENV
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

      if (error) {
        console.error("Login error from Supabase:", error);
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      if (user) {
        res.json({ ...user, branch_name: (user as any).branches?.name });
      } else {
        res.status(401).json({ error: "Credenciales inválidas" });
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Clients API
  app.get("/api/clients", async (req, res) => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/clients", async (req, res) => {
    const { name, phone, whatsapp, address, city, type, source } = req.body;
    const { data, error } = await supabase
      .from("clients")
      .insert([{ name, phone, whatsapp, address, city, type, source }])
      .select();
    
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
    let query = supabase
      .from("orders")
      .select("*, clients(name), users(role)")
      .order("created_at", { ascending: false });

    if (branch_id) query = query.eq("branch_id", branch_id);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const formattedData = data.map(o => ({
      ...o,
      client_name: (o as any).clients?.name,
      user_name: (o as any).users?.role
    }));

    res.json(formattedData);
  });

  app.get("/api/orders/:id", async (req, res) => {
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, clients(name)")
      .eq("id", req.params.id)
      .single();

    if (orderErr) return res.status(500).json({ error: orderErr.message });

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("*, products(name)")
      .eq("order_id", req.params.id);

    const { data: payments, error: payErr } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", req.params.id);

    res.json({ 
      ...order, 
      client_name: (order as any).clients?.name,
      items: items?.map(i => ({ ...i, product_name: (i as any).products?.name })), 
      payments 
    });
  });

  app.post("/api/orders", async (req, res) => {
    const { client_id, user_id, branch_id, status, priority, delivery_mode, total, items } = req.body;
    
    // Create Order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert([{ client_id, user_id, branch_id, status, priority, delivery_mode, total }])
      .select()
      .single();

    if (orderErr) return res.status(500).json({ error: orderErr.message });
    
    const orderId = order.id;
    
    // Create Items
    const itemsToInsert = items.map((item: any) => ({
      order_id: orderId,
      product_id: item.product_id,
      quality: item.quality,
      color: item.color,
      second_color: item.second_color,
      size: item.size,
      additional: item.additional,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      production_status: 'Pendiente'
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(itemsToInsert);
    if (itemsErr) return res.status(500).json({ error: itemsErr.message });

    // Audit Log
    await supabase.from("audit_log").insert([{
      user_id,
      action: 'Crear Pedido',
      details: `Pedido #${orderId} creado para cliente ID ${client_id}`
    }]);

    res.json({ id: orderId });
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    const { status, user_id } = req.body;
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    await supabase.from("audit_log").insert([{
      user_id,
      action: 'Actualizar Estado',
      details: `Pedido #${req.params.id} cambiado a ${status}`
    }]);

    res.json({ success: true });
  });

  // Payments API
  app.post("/api/payments", async (req, res) => {
    const { order_id, user_id, amount, type, method } = req.body;
    
    const { error: payErr } = await supabase
      .from("payments")
      .insert([{ order_id, user_id, amount, type, method }]);
    
    if (payErr) return res.status(500).json({ error: payErr.message });

    // Update order paid amount (Note: In Supabase/Postgres we usually do this with a function or trigger, but here we'll do it manually for simplicity)
    const { data: order } = await supabase.from("orders").select("paid").eq("id", order_id).single();
    const newPaid = (order?.paid || 0) + amount;
    
    await supabase.from("orders").update({ paid: newPaid }).eq("id", order_id);

    await supabase.from("audit_log").insert([{
      user_id,
      action: 'Registrar Pago',
      details: `Pago de ${amount} para Pedido #${order_id}`
    }]);

    res.json({ success: true });
  });

  // Expenses API
  app.get("/api/expenses", async (req, res) => {
    const { branch_id } = req.query;
    let query = supabase
      .from("expenses")
      .select("*, branches(name), users(role)")
      .order("created_at", { ascending: false });

    if (branch_id) query = query.eq("branch_id", branch_id);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const formattedData = data.map(e => ({
      ...e,
      branch_name: (e as any).branches?.name,
      user_name: (e as any).users?.role
    }));

    res.json(formattedData);
  });

  app.post("/api/expenses", async (req, res) => {
    const { branch_id, user_id, category, description, amount, method } = req.body;
    const { error } = await supabase
      .from("expenses")
      .insert([{ branch_id, user_id, category, description, amount, method }]);
    
    if (error) return res.status(500).json({ error: error.message });

    await supabase.from("audit_log").insert([{
      user_id,
      action: 'Registrar Gasto',
      details: `Gasto de ${amount} en ${category}`
    }]);

    res.json({ success: true });
  });

  // Dashboard Stats API
  app.get("/api/stats", async (req, res) => {
    const { branch_id } = req.query;
    const today = new Date().toISOString().split('T')[0];

    try {
      // Sales Today
      let salesQuery = supabase.from("orders").select("total").gte("created_at", today);
      if (branch_id) salesQuery = salesQuery.eq("branch_id", branch_id);
      const { data: sales } = await salesQuery;
      const salesToday = sales?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

      // Payments Today
      let payQuery = supabase.from("payments").select("amount").gte("created_at", today);
      if (branch_id) {
        const { data: branchOrders } = await supabase.from("orders").select("id").eq("branch_id", branch_id);
        const orderIds = branchOrders?.map(o => o.id) || [];
        payQuery = payQuery.in("order_id", orderIds);
      }
      const { data: payments } = await payQuery;
      const paymentsToday = payments?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

      // Expenses Today
      let expQuery = supabase.from("expenses").select("amount").gte("created_at", today);
      if (branch_id) expQuery = expQuery.eq("branch_id", branch_id);
      const { data: expenses } = await expQuery;
      const expensesToday = expenses?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

      // Pending Orders
      let pendingQuery = supabase.from("orders").select("id", { count: 'exact' }).not("status", "in", '("Entregado", "Cerrado", "Cancelado")');
      if (branch_id) pendingQuery = pendingQuery.eq("branch_id", branch_id);
      const { count: pendingCount } = await pendingQuery;

      // Production Orders
      let prodQuery = supabase.from("orders").select("id", { count: 'exact' }).eq("status", "En producción");
      if (branch_id) prodQuery = prodQuery.eq("branch_id", branch_id);
      const { count: prodCount } = await prodQuery;

      res.json({
        salesToday,
        paymentsToday,
        expensesToday,
        pendingOrders: pendingCount || 0,
        productionOrders: prodCount || 0
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Branches API
  app.get("/api/branches", async (req, res) => {
    const { data, error } = await supabase.from("branches").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
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

  return app;
}

const serverPromise = createServer();

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  serverPromise.then(app => {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default app;
