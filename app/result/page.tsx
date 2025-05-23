"use client";

import { useSearchParams } from "next/navigation";
import SentimentForm from "../components/sentimentForm";
import ResultComponent from "./ResultComponent";
import Link from "next/link";
import TestPage from "./test";
import NewPage from "./New";

const Page = () => {
  const searchParams = useSearchParams();
  const youtubeLink = searchParams.get("link");

  return (
    <div className="p-6">
      {/*{!youtubeLink ? <SentimentForm /> : <ResultComponent />}
      <TestPage/>*/}
      <NewPage/>
      <Link href="/">Try for Another YouTube Video</Link>
    </div>
  );
};

export default Page;
