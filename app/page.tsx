"use client";

import { UploadSection } from "@/frontend/components/UploadSection";
import { RecentPapers } from "@/frontend/components/RecentPapers";
import { StatsCard } from "@/frontend/components/StatsCard";
import { FileText, MessageSquare, Clock, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-left space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your research papers and chat sessions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Papers"
              value="12"
              icon={<FileText className="h-4 w-4" />}
              trend="+2"
            />
            <StatsCard
              title="Chats"
              value="48"
              icon={<MessageSquare className="h-4 w-4" />}
              trend="+5"
            />
            <StatsCard
              title="Hours Saved"
              value="36"
              icon={<Clock className="h-4 w-4" />}
              trend="+8"
            />
            <StatsCard
              title="Pages"
              value="892"
              icon={<BookOpen className="h-4 w-4" />}
              trend="+120"
            />
          </div>

          <RecentPapers />
        </div>

        <div className="lg:col-span-1">
          <UploadSection />
        </div>
      </div>
    </div>
  );
}