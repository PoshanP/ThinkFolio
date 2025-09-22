"use client";

import { ChatInterface } from "@/frontend/components/ChatInterface";
import { PaperSidebar } from "@/frontend/components/PaperSidebar";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function ChatPage({ params }: { params: { id: string } }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-[calc(100vh-5rem)] -mx-4 -my-8">
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative w-80 h-full transition-transform duration-300 z-40`}
      >
        <PaperSidebar paperId={params.id} />
      </div>

      <div className="flex-1 flex flex-col">
        <ChatInterface paperId={params.id} />
      </div>
    </div>
  );
}