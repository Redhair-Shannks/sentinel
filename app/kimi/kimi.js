async function getChatResponse() {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer <OPENROUTER_API_KEY>",
                "HTTP-Referer": "<YOUR_SITE_URL>", // Optional
                "X-Title": "<YOUR_SITE_NAME>", // Optional
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "deepseek/deepseek-r1:free",
                "messages": [
                    {
                        "role": "user",
                        "content": "What is the meaning of life?"
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Extract the model's response
        const answer = data.choices?.[0]?.message?.content || "No response from model.";
        return answer;
    } catch (error) {
        console.error("Error fetching response:", error);
        return "An error occurred while fetching the response.";
    }
}

// Example usage
getChatResponse().then(answer => console.log("Model's answer:", answer));
