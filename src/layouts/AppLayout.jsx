import { Outlet } from "react-router-dom";

import Header from "../components/layout/Header";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="angel-container py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}