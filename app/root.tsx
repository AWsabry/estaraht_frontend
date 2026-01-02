import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { LanguageProvider } from "./contexts/LanguageContext";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Estraht Medical Platform - Admin Dashboard" />
        <meta name="theme-color" content="#204FCF" />
        {/* Force HTTPS in production - upgrade insecure requests */}
        {import.meta.env.PROD && (
          <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        )}
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('language');
                  const lang = (saved === 'en' || saved === 'ar') ? saved : 'en';
                  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
                  document.documentElement.lang = lang;
                } catch (e) {
                  // localStorage not available, use default
                  document.documentElement.dir = 'ltr';
                  document.documentElement.lang = 'en';
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Outlet />
    </LanguageProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // Silently handle Chrome DevTools well-known requests
  if (error instanceof Error) {
    const errorMessage = error.message || '';
    if (errorMessage.includes('.well-known') || 
        errorMessage.includes('well-known') || 
        errorMessage.includes('appspecific') ||
        errorMessage.includes('devtools')) {
      // Return null to suppress the error for well-known paths (Chrome DevTools)
      return null;
    }
  }

  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;
  let statusCode: number | undefined;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    message = error.status === 404 ? "404 - Page Not Found" : `Error ${error.status}`;
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (error && error instanceof Error) {
    details = error.message;
    // Only show stack in development
    if (import.meta.env.DEV) {
      stack = error.stack;
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e8edfc] to-[#FCDED6] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{message}</h1>
          {statusCode && (
            <p className="text-sm text-gray-500">Status Code: {statusCode}</p>
          )}
        </div>
        <p className="text-gray-600 mb-6">{details}</p>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-[#204FCF] text-white rounded-lg hover:bg-[#1a3fb5] transition-colors"
        >
          Go to Dashboard
        </a>
        {stack && import.meta.env.DEV && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              Error Details (Development Only)
            </summary>
            <pre className="w-full p-4 bg-gray-100 rounded overflow-x-auto text-xs">
              <code>{stack}</code>
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
