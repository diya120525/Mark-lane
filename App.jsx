import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProducts } from "./services/productService";
import { saveOrder } from "./services/orderService";
import { useCart } from "./hooks/useCart";
import { applyCoupon, discountAmount, COUPONS } from "./data/coupons";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import CheckoutForm from "./components/CheckoutForm";
import { formatINR } from "./utils/format";

export default function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");

  const [cart, dispatch] = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const loadProducts = useCallback(async () => {
    setStatus("loading");
    setLoadError("");
    try {
      const data = await fetchProducts();
      setProducts(data);
      setStatus("ready");
    } catch (err) {
      setLoadError(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Keep cart items aligned with the latest prices and stock.
  useEffect(() => {
    if (products.length) dispatch({ type: "syncStock", products });
  }, [products, dispatch]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category))],
    [products]
  );

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, search, category, sort]);

  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const coupon = cart.couponCode ? COUPONS[cart.couponCode] : null;
  const discount = discountAmount(coupon, subtotal);
  const total = subtotal - discount;
  const cartCount = cart.items.reduce((sum, i) => sum + i.qty, 0);

  const couponNote =
    coupon && discount === 0
      ? `${cart.couponCode} is paused until your subtotal reaches ${formatINR(coupon.minSubtotal)}.`
      : "";

  function handleApplyCoupon(input) {
    const result = applyCoupon(input, subtotal);
    if (result.error) return result.error;
    dispatch({ type: "applyCoupon", code: result.code });
    return "";
  }

  function placeOrder(customer) {
    for (const item of cart.items) {
      const product = products.find((p) => p.id === item.id);
      if (!product || item.qty > product.stock) {
        const left = product?.stock ?? 0;
        return `Only ${left} of ${item.name} left. Update your cart and try again.`;
      }
    }

    const order = {
      id: Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      customer,
      items: cart.items.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
      subtotal,
      discount,
      total,
      couponCode: discount > 0 ? cart.couponCode : null,
    };

    if (!saveOrder(order)) {
      return "We could not save your order. Please try again.";
    }

    setProducts((prev) =>
      prev.map((p) => {
        const bought = cart.items.find((i) => i.id === p.id);
        return bought ? { ...p, stock: p.stock - bought.qty } : p;
      })
    );
    dispatch({ type: "clear" });
    setCheckingOut(false);
    setLastOrder(order);
    return "";
  }

  return (
    <div className="app">
      <header className="site-header">
        <h1>Market Lane</h1>
        <p className="cart-count">
          {cartCount} {cartCount === 1 ? "item" : "items"} in cart
        </p>
      </header>

      {lastOrder && (
        <div className="order-banner" role="status">
          <div>
            <strong>Order {lastOrder.id} placed.</strong>
            <p>
              Thanks, {lastOrder.customer.name}. We will send updates to {lastOrder.customer.email}.
            </p>
          </div>
          <button className="link" onClick={() => setLastOrder(null)}>Dismiss</button>
        </div>
      )}

      <main className="layout">
        <section aria-labelledby="catalogue-title">
          <h2 id="catalogue-title" className="section-title">Products</h2>

          <div className="controls">
            <div className="field">
              <label htmlFor="search">Search</label>
              <input
                id="search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or category"
              />
            </div>
            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sort">Sort by</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {status === "loading" && <p className="muted" role="status">Loading products…</p>}

          {status === "error" && (
            <div className="error-box" role="alert">
              <p>{loadError}</p>
              <button className="btn-secondary" onClick={loadProducts}>Try again</button>
            </div>
          )}

          {status === "ready" && visibleProducts.length === 0 && (
            <p className="muted">No products match these filters. Clear the search or pick another category.</p>
          )}

          {status === "ready" && visibleProducts.length > 0 && (
            <ProductList
              products={visibleProducts}
              cartItems={cart.items}
              onAdd={(product) => dispatch({ type: "add", product })}
            />
          )}
        </section>

        <aside className="sidebar">
          <Cart
            items={cart.items}
            subtotal={subtotal}
            discount={discount}
            total={total}
            couponCode={discount > 0 ? cart.couponCode : null}
            couponNote={couponNote}
            checkingOut={checkingOut}
            onQty={(id, qty) => dispatch({ type: "setQty", id, qty })}
            onRemove={(id) => dispatch({ type: "remove", id })}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={() => dispatch({ type: "removeCoupon" })}
            onCheckout={() => setCheckingOut(true)}
          />
          {checkingOut && cart.items.length > 0 && (
            <CheckoutForm onPlaceOrder={placeOrder} onCancel={() => setCheckingOut(false)} />
          )}
        </aside>
      </main>
    </div>
  );
}
