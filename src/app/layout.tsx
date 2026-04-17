import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { LangProvider } from "@/components/providers/lang-provider";

export const metadata: Metadata = {
  title: "أثر | منصة التبرعات والحملات الخيرية",
  description: "منصة أثر - تبرع وأحدث أثراً في حياة الآخرين. حملات خيرية موثوقة ومعتمدة.",
  keywords: ["تبرع", "حملات خيرية", "أثر", "صدقة", "زكاة"],
  authors: [{ name: "Athar Team" }],
  openGraph: {
    title: "أثر | منصة التبرعات",
    description: "تبرع وأحدث أثراً في حياة الآخرين",
    locale: "ar_SA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-cairo">
        <LangProvider>
          <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              style: {
                fontFamily: "Cairo, sans-serif",
                direction: "rtl",
              },
            }}
          />
        </ThemeProvider>
          </LangProvider>
      </body>
    </html>
  );
}
