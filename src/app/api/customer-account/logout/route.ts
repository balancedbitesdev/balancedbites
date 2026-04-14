import { NextRequest, NextResponse } from "next/server";
import {
  CUSTOMER_ACCOUNT_TOKEN_COOKIE,
  customerAccountAppBaseUrl,
} from "@/lib/customer-account-oauth";
import { BB_CART_COOKIE } from "@/lib/shopify-cart";

export async function GET(request: NextRequest) {
  const base = customerAccountAppBaseUrl() ?? new URL(request.url).origin;
  const res = NextResponse.redirect(new URL("/account", base));
  res.cookies.delete(CUSTOMER_ACCOUNT_TOKEN_COOKIE);
  res.cookies.delete(BB_CART_COOKIE);
  return res;
}
