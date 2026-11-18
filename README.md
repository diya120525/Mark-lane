# Market Lane

A small e-commerce storefront built with React and Vite.

## Features

- Products load from `public/products.json` through a service layer, with loading and error states and a retry button.
- Search by name or category, filter by category, and sort by price or name.
- Add to cart, increase and decrease quantities, and remove items.
- Stock validation: quantities cannot exceed available stock, and checkout re-checks stock before placing an order.
- Subtotal, discount and final total, calculated live.
- Coupon codes: `SAVE10` (10% off) and `FLAT200` (₹200 off orders of ₹1,500 or more).
- Checkout form with validation for name, email, Indian mobile number, address and pincode.
- Cart and orders persist in `localStorage`, so they survive a page refresh.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Project structure

```
public/products.json        Product catalogue (stands in for an API)
src/services/               Fetching products and saving orders
src/hooks/useCart.js        Cart state, reducer and localStorage persistence
src/data/coupons.js         Coupon definitions and discount rules
src/components/             ProductList, Cart, CheckoutForm
src/App.jsx                 Filters, totals and page layout
```

## Notes

- Persistence uses `localStorage`. To use a real database, replace the body of `saveOrder` in `src/services/orderService.js` with a POST request to your backend.
- To use a real product API, change the URL in `src/services/productService.js`.
