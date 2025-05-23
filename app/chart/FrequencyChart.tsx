"use client";
import React from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    TimeScale,
    Tooltip,
} from "chart.js";
import "chartjs-adapter-luxon";

// Register required Chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, TimeScale, Tooltip);

// Raw relative date data
const rawData = [
    "1 days ago",
    "1 days ago",
    "2 days ago",
    "2 days ago",
    "3 days ago",
    "4 days ago",
    "4 days ago",
    "4 days ago",
    "5 days ago"
];

// Convert "X days ago" to absolute date (YYYY-MM-DD)
const convertRelativeToAbsolute = (relativeDate: string): string => {
    const daysAgo = parseInt(relativeDate.split(" ")[0], 10); // Extract number of days
    const date = new Date();
    date.setDate(date.getDate() - daysAgo); // Subtract days from current date
    return date.toISOString().split("T")[0]; // Return as YYYY-MM-DD
};

// Convert all dates and count occurrences
const absoluteDates = rawData.map(convertRelativeToAbsolute);
const freqMap: Record<string, number> = {};
absoluteDates.forEach(date => {
    freqMap[date] = (freqMap[date] || 0) + 1;
});

// Extract labels (dates) and values (frequencies)
const labels = Object.keys(freqMap).sort(); // Sort for correct order
const values = Object.values(freqMap);

const data = {
    labels: labels, // Absolute dates
    datasets: [
        {
            label: "Frequency",
            data: values, // Frequency count
            borderColor: "blue",
            backgroundColor: "rgba(0, 0, 255, 0.2)",
            borderWidth: 2,
            pointRadius: 5,
        },
    ],
};

const options = {
    responsive: true,
    scales: {
        x: {
            type: "time" as const,
            time: {
                unit: "day",
                tooltipFormat: "yyyy-MM-dd", // Tooltip shows absolute date
                displayFormats: {
                    day: "yyyy-MM-dd", // X-axis labels as absolute dates
                },
            },
            ticks: {
                source: "data", // Ensure exact dates are used
            },
        },
        y: { beginAtZero: true },
    },
};

const FrequencyChart: React.FC = () => {
    return (
        <div style={{ width: "80%", margin: "auto" }}>
            <h2>Frequency Over Time</h2>
            <Line data={data} options={options} />
        </div>
    );
};

export default FrequencyChart;
