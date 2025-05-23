"use client";

import { useSearchParams } from "next/navigation";

const NewPage = () => {
  const searchParams = useSearchParams();
  const commentsData = searchParams.get("comments");

  let comments = [];
  try {
    comments = commentsData ? JSON.parse(decodeURIComponent(commentsData)) : [];
  } catch (error) {
    console.error("Error parsing comments:", error);
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold text-center mb-4">YouTube Comments</h2>
      <div className="w-full max-w-2xl space-y-4">
        {comments.length > 0 ? (
          comments.map((comment: any, index: number) => (
            <div key={index} className="p-4 bg-gray-800 rounded-lg shadow-lg">
              <p className="text-lg">{comment.text}</p>
              <div className="flex justify-between text-gray-400 text-sm mt-2">
                <span>❤️ {comment.hearted ? "Yes" : "No"}</span>
                <span>👍 {comment.votes}</span>
                <span>💬 {comment.replies} Replies</span>
                <span>🕒 {comment.time}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400">No comments found.</p>
        )}
      </div>
    </div>
  );
};

export default NewPage;
