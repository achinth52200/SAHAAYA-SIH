import httpx
import time

# Wait for server to be ready
time.sleep(3)

# Test health
r = httpx.get('http://localhost:8000/health')
print('Health:', r.json())

# Test list victims
r = httpx.get('http://localhost:8000/api/v1/victims')
print('Victims count:', len(r.json()))
for v in r.json()[:3]:
    print(f'  {v["victim_id"]}: {v["latest_score"]} ({v["latest_band"]})')

# Test distress for VICTIM_0001
r = httpx.get('http://localhost:8000/api/v1/victims/VICTIM_0001/distress')
print('VICTIM_0001 distress:', r.json()['distress_score'], r.json()['band'])

# Test explanation
r = httpx.get('http://localhost:8000/api/v1/victims/VICTIM_0001/explanation')
print('Explanation narrative:', r.json()['narrative'][:80])

# Test alerts
r = httpx.get('http://localhost:8000/api/v1/alerts')
print('Alerts:', len(r.json()))

# Test district dashboard
r = httpx.get('http://localhost:8000/api/v1/dashboard/district/District_14')
print('District dashboard:', r.json()['band_distribution'])

# Test national dashboard
r = httpx.get('http://localhost:8000/api/v1/dashboard/national')
print('National dashboard:', r.json()['band_distribution'])