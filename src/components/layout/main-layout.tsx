import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ChatbotWidget from "@/components/chatbot/chatbot-widget";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-[72px]">{children}</main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
