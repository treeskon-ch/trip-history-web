import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen text-gray-800">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full bg-light relative">
        <Header />
        {children}
      </main>
    </div>
  );
}
