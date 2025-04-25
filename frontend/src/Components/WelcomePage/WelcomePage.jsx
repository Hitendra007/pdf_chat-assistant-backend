import React from "react";
import { Link } from "react-router-dom";

const WelcomePage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <main className="flex flex-col items-center text-center px-6 py-16">
        <h2 className="text-4xl font-bold mb-4">
          Chat with your PDF documents using AI
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-xl">
          Upload any PDF and start a conversation. Get instant answers, insights, and summaries from your documents with our advanced AI assistant.
        </p>
        <Link
          to="/signup"
          className="bg-blue-600 text-white px-6 py-3 rounded text-lg hover:bg-blue-700"
        >
          Get Started Free
        </Link>
        <div className="mt-4">
          <Link to="/login" className="text-blue-500 hover:underline">
            Already have an account? Login
          </Link>
        </div>
      </main>

      {/* How it works */}
      <section className="bg-white py-16 px-6">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {[
            {
              title: "1. Upload Your Document",
              desc: "Upload any PDF document you want to chat with. Our system will process and analyze it.",
            },
            {
              title: "2. Ask Questions",
              desc: "Ask any question about your document. Our AI will find relevant information.",
            },
            {
              title: "3. Get Instant Answers",
              desc: "Receive accurate answers and insights instantly, directly from your document.",
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className="p-6 border rounded-lg shadow hover:shadow-lg transition"
            >
              <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
              <p className="text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;
