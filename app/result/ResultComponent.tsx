"use client";

import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import Papa from "papaparse";


// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);


interface TableRowData {
  Category: "Sentiment" | "Top Liked Comment" | "Top Replied Comment" | "Emoji";
  Type: string;
  Value: string;
  Frequency: number | "N/A";
  Hearted?: number | "N/A";
}


const ResultComponent = () => {
  const [data, setData] = useState<TableRowData[]>([]);

  

  useEffect(() => {
    fetch("/youtube_sentiment_analysis.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const parsedData = Papa.parse(csvText, { 
          header: true, 
          skipEmptyLines: true,
          dynamicTyping: true // ✅ Ensures numbers are correctly read
        }).data as TableRowData[];

        setData(parsedData);
      });
  }, []);

  

  // Extract sentiment distribution
  const sentimentData = data
    .filter((row) => row.Category === "Sentiment")
    .map((row) => ({
      label: row.Type.trim(),  
      value: typeof row.Frequency === "number" ? row.Frequency : 0,
    }));

  const totalSentiment = sentimentData.reduce((sum, row) => sum + row.value, 0);
  
  const sentimentChartData = {
    labels: sentimentData.map((row) => row.label),
    datasets: [
      {
        label: "Sentiment Distribution",
        data: sentimentData.map((row) => row.value),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        hoverBackgroundColor: ["#FF4B5C", "#2F8FCE", "#E3B045"],
        borderWidth: 2,
      },
    ],
  };

  // Extract top liked comments
  const topLikedComments = data.filter((row) => row.Category === "Top Liked Comment").slice(0, 5);

  // Extract top replied comments
  const topRepliedComments = data.filter((row) => row.Category === "Top Replied Comment").slice(0, 5);

  // Extract top emojis
  const topEmojis = data.filter((row) => row.Category === "Emoji").slice(0, 5);

  const sentimentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            const dataset = tooltipItem.dataset?.data || [];
            if (dataset.length === 0) return "No data";
  
            const total = dataset.reduce((acc: number, val: number) => acc + val, 0);
            const value = dataset[tooltipItem.dataIndex] || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  
            return `${tooltipItem.label}: ${percentage}%`;
          },
        },
      },
      legend: {
        labels: {
          generateLabels: function (chart) {
            const data = chart.data.datasets[0]?.data || [];
            const total = data.reduce((sum: number, value: number) => sum + value, 0);
  
            return chart.data.labels.map((label, index) => {
              const percentage = total > 0 ? ((data[index] / total) * 100).toFixed(1) : "0.0";
              return {
                text: `${label} (${percentage}%)`,
                fillStyle: chart.data.datasets[0].backgroundColor[index],
              };
            });
          },
        },
      },
    },
  };
  
  

  return (
    <div className="p-6 space-y-6 text-black">
      {/* Sentiment Analysis Pie Chart */}
      <Card>
        <CardContent>
          <h2 className="text-2xl font-bold mb-4 text-center">Sentiment Distribution</h2>
          <div className="flex justify-center">
            <div className="w-80 h-80">
              <Doughnut data={sentimentChartData} options={sentimentChartOptions} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Liked Comments Table */}
      <Card>
        <CardContent>
          <h2 className="text-2xl font-bold mb-4 text-center">Top 5 Liked Comments</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comment</TableHead>
                <TableHead>Likes</TableHead>
                <TableHead>Hearted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topLikedComments.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.Value}</TableCell>
                  <TableCell>{row.Frequency}</TableCell>
                  <TableCell>{row.Hearted === 1 ? "❤️ Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Replied Comments Table */}
      <Card>
        <CardContent>
          <h2 className="text-2xl font-bold mb-4 text-center">Top 5 Replied Comments</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comment</TableHead>
                <TableHead>Replies</TableHead>
                <TableHead>Hearted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topRepliedComments.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.Value}</TableCell>
                  <TableCell>{row.Frequency}</TableCell>
                  <TableCell>{row.Hearted === 1 ? "❤️ Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Emojis Table */}
      <Card>
        <CardContent>
          <h2 className="text-2xl font-bold mb-4 text-center">Top 5 Emojis</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emoji</TableHead>
                <TableHead>Frequency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topEmojis.map((row, index) => (
                <TableRow key={index}>
                  <TableCell >{row.Value}</TableCell>
                  <TableCell >{row.Frequency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
    </div>
  );
};




export default ResultComponent;
