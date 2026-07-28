import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "سامانه خدمات پس از فروش | همراه سرویس",
  description: "مدیریت پذیرش، تعمیر، قطعات و گزارش‌گیری خدمات پس از فروش",
};

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('hamrah-theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e){}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
