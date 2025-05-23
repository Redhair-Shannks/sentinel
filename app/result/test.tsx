"use client";  // Add this at the top

import { useRouter } from "next/navigation";

const TestPage = () => {
  const router = useRouter();
  const file = router.query?.file;  // Use optional chaining to prevent errors

  const handleDownload = () => {
    if (file) {
      window.open(`https://your-api-url.com/download/${file}`, "_blank"); // Replace with actual API URL
    } else {
      alert("No file available for download.");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 p-6">
      <h1 className="text-2xl font-bold text-white text-center mb-6">
        Sentiment Analysis Results
      </h1>
      <button
        onClick={handleDownload}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
      >
        Download CSV
      </button>
    </div>
  );
};

export default TestPage;
