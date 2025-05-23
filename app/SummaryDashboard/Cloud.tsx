"use client";

import React from "react";
import WordCloud from "react-d3-cloud";

const Cloud = ({ wordAndEmojiTrends }) => {
  if (!wordAndEmojiTrends || !wordAndEmojiTrends.wordFrequency) {
    return <p className="text-black">No words available for the cloud.</p>;
  }

  // Map over wordFrequency similar to hashtagBarData & emojiBarData
  const data = wordAndEmojiTrends.wordFrequency.map((item: any) => ({
    text: item.word,
    value: item.count,
  }));

  // Define font size based on count value
  const fontSizeMapper = (word) => Math.log2(word.value + 1) * 10;
  const rotate = () => Math.floor(Math.random() * 90) - 45; // Random rotation

  return (
    <div className="flex justify-center">
      <WordCloud
        data={data}
        fontSizeMapper={fontSizeMapper}
        rotate={rotate}
        padding={5}
        width={500}
        height={300}
      />
    </div>
  );
};

export default Cloud;
