import requests

url = "http://localhost:8083/api/v1/sources/12796997-9814-4c24-ba76-5362ad18867d/jobs"
response = requests.get(url)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")

