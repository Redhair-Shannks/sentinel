import requests
import json

# Your deployed endpoint URL
url = "https://youtube-scraper-api-service.onrender.com/comments/"

# Payload with a YouTube video URL
payload = {
    "url": "https://www.youtube.com/watch?v=zWl-fb1Ih7A"
}

# Headers indicating we're sending JSON data
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print("Status code:", response.status_code)
    
    # Try to parse the response as JSON
    data = response.json()
    print("Response JSON:")
    print(json.dumps(data, indent=2))
except Exception as e:
    print("Error occurred:", e)
    print("Response content:", response.content)