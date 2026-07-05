import requests

res = requests.post("http://localhost:5174/api/v1/auth/login", data={"username": "admin@kt.com", "password": "password"})
token = res.json().get("access_token")
print("Login status:", res.status_code)
print("Token:", token)

if token:
    headers = {"Authorization": f"Bearer {token}"}
    logs_res = requests.get("http://localhost:5174/api/v1/logs", headers=headers)
    print("Logs Status:", logs_res.status_code)
    if logs_res.status_code != 200:
        print("Logs Error:", logs_res.text)
        
    stats_res = requests.get("http://localhost:5174/api/v1/projects/dashboard/stats", headers=headers)
    print("Stats Status:", stats_res.status_code)
    if stats_res.status_code != 200:
        print("Stats Error:", stats_res.text)

