import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  index("routes/home.tsx"),
  route("users", "routes/users.tsx"),
  route("doctors", "routes/doctors.tsx"),
  route("doctors/:id", "routes/doctors.$id.tsx"),
  route("patients", "routes/patients.tsx"),
  route("patients/:id", "routes/patients.$id.tsx"),
  route("bookings", "routes/bookings.tsx"),
  route("transactions", "routes/transactions.tsx"),
  route("withdrawals", "routes/withdrawals.tsx"),
  route("coupons", "routes/coupons.tsx"),
  route("reviews", "routes/reviews.tsx"),
] satisfies RouteConfig;
