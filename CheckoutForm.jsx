import { useState } from "react";

const EMPTY = { name: "", email: "", phone: "", address: "", pincode: "" };

export function validateCheckout(v) {
  const errors = {};
  if (v.name.trim().length < 2) errors.name = "Enter your full name (at least 2 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) {
    errors.email = "Enter a valid email, like name@example.com.";
  }
  if (!/^[6-9]\d{9}$/.test(v.phone.replace(/\s/g, ""))) {
    errors.phone = "Enter a 10-digit Indian mobile number.";
  }
  if (v.address.trim().length < 10) errors.address = "Enter a full delivery address.";
  if (!/^\d{6}$/.test(v.pincode.trim())) errors.pincode = "Pincode must be 6 digits.";
  return errors;
}

export default function CheckoutForm({ onPlaceOrder, onCancel }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validateCheckout(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const error = onPlaceOrder({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.replace(/\s/g, ""),
      address: values.address.trim(),
      pincode: values.pincode.trim(),
    });
    setSubmitting(false);
    setSubmitError(error);
  }

  const field = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={values[name]}
        onChange={handleChange}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        {...props}
      />
      {errors[name] && <p id={`${name}-error`} className="field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <section className="checkout" aria-labelledby="checkout-title">
      <h2 id="checkout-title">Delivery details</h2>
      <form onSubmit={handleSubmit} noValidate>
        {field("name", "Full name", { autoComplete: "name" })}
        {field("email", "Email", { type: "email", autoComplete: "email" })}
        {field("phone", "Mobile number", { type: "tel", inputMode: "numeric", autoComplete: "tel", placeholder: "9876543210" })}
        <div className="field">
          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            name="address"
            rows={3}
            value={values.address}
            onChange={handleChange}
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? "address-error" : undefined}
          />
          {errors.address && <p id="address-error" className="field-error">{errors.address}</p>}
        </div>
        {field("pincode", "Pincode", { inputMode: "numeric", autoComplete: "postal-code", maxLength: 6 })}

        {submitError && <p className="field-error" role="alert">{submitError}</p>}

        <div className="checkout-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Back to cart</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Placing order…" : "Place order"}
          </button>
        </div>
      </form>
    </section>
  );
}
