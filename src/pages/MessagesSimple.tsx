import { useState } from "react";
import { Header } from "@/components/Header";
import { MessagingPage } from "@/components/messaging";

const MessagesSimple = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
        <MessagingPage />
      </main>
    </div>
  );
};

export default MessagesSimple;
