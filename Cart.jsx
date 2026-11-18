import { useState } from "react";
import { formatINR } from "../utils/format";

export default function Cart({
  items,
  subtotal,
  discount,
  total,
  couponCode,
  couponNote,
  onQty,
  onRemove,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
  checkingOut,
}) {
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState("");

  function handleApply(e) {
    e.preventDefault();
    const error = onApplyCoupon(code);
    setCouponError(error);
    if (!error) setCode("");
  }

  if (items.length === 0) {
    return (
      <section className="cart" aria-labelledby="cart-title">
        <h2 id="cart-title">Your cart</h2>
        <p className="muted">Your cart is empty. Add a product to start an order.</p>
      </section>
    );
  }

  return (
    <section className="cart" aria-labelledby="cart-title">
      <h2 id="cart-title">Your cart</h2>

      <ul className="cart-items">
        {items.map((item) => (
          <li key={item.id} className="cart-item">
            <span className="cart-emoji" aria-hidden="true">{item.emoji}</span>
            <div className="cart-item-info">
              <span className="cart-item-name">{item.name}</span>
              <span className="muted">{formatINR(item.price)} each</span>
              <div className="qty">
                <button
                  aria-label={`Decrease quantity of ${item.name}`}
                  onClick={() => onQty(item.id, item.qty - 1)}
                  disabled={item.qty <= 1}
                >
                  −
                </button>
                <span aria-live="polite">{item.qty}</span>
                <button
                  aria-label={`Increase quantity of ${item.name}`}
                  onClick={() => onQty(item.id, item.qty + 1)}
                  disabled={item.qty >= item.stock}
                >
                  +
                </button>
              </div>
            </div>
            <div className="cart-item-side">
              <span>{formatINR(item.price * item.qty)}</span>
              <button className="link" onClick={() => onRemove(item.id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>

      <form className="coupon-form" onSubmit={handleApply} noValidate>
        <label htmlFor="coupon">Coupon code</label>
        <div className="coupon-row">
          <input
            id="coupon"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. SAVE10"
            autoComplete="off"
          />
          <button type="submit" className="btn-secondary">Apply</button>
        </div>
        {couponError && <p className="field-error" role="alert">{couponError}</p>}
        {couponCode && (
          <p className="coupon-applied">
            {couponCode} applied.{" "}
            <button type="button" className="link" onClick={onRemoveCoupon}>Remove</button>
          </p>
        )}
        {couponNote && <p className="muted">{couponNote}</p>}
      </form>

      <dl className="totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatINR(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div>
            <dt>Discount</dt>
            <dd>−{formatINR(discount)}</dd>
          </div>
        )}
        <div className="grand">
          <dt>Total</dt>
          <dd>{formatINR(total)}</dd>
        </div>
      </dl>

      {!checkingOut && (
        <button className="btn-primary full" onClick={onCheckout}>Proceed to checkout</button>
      )}
    </section>
  );
}
