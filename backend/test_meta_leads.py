import requests
import json

# Test Meta Lead Ads Webhook Endpoint

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("Testing Meta Lead Ads Webhook Endpoint")
print("=" * 60)

# Test 1: Valid lead
print("\n1. Testing valid lead submission:")
valid_payload = {
    "object_type": "leadgen",
    "lead_data": {
        "leadgen_id": "12345678901234567",
        "form_id": "form_abc123",
        "ad_id": "ad_xyz789",
        "campaign_id": "campaign_meta_001",
        "adset_id": "adset_456",
        "created_time": "2026-11-25T14:00:00Z",
        "full_name": "Priya Sharma",
        "phone_number": "+91 98765 43210",
        "city": "mumbai"
    }
}

response = requests.post(f"{BASE_URL}/api/meta-leads/webhook", json=valid_payload)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 2: Duplicate lead ID
print("\n2. Testing duplicate lead ID (same leadgen_id):")
response = requests.post(f"{BASE_URL}/api/meta-leads/webhook", json=valid_payload)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 3: Duplicate phone number (different lead)
print("\n3. Testing duplicate phone number (new lead, same phone):")
duplicate_phone_payload = {
    "object_type": "leadgen",
    "lead_data": {
        "leadgen_id": "99999999999999999",
        "form_id": "form_xyz999",
        "campaign_id": "campaign_meta_002",
        "created_time": "2026-11-25T14:30:00Z",
        "full_name": "Priya Sharma Again",
        "phone_number": "9876543210",
        "city": "Delhi NCR"
    }
}

response = requests.post(f"{BASE_URL}/api/meta-leads/webhook", json=duplicate_phone_payload)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 4: Invalid phone format
print("\n4. Testing invalid phone format:")
invalid_phone_payload = {
    "object_type": "leadgen",
    "lead_data": {
        "leadgen_id": "88888888888888888",
        "form_id": "form_bad",
        "campaign_id": "campaign_test",
        "created_time": "2026-11-25T14:35:00Z",
        "full_name": "Test User",
        "phone_number": "123",
        "city": "Bengaluru"
    }
}

response = requests.post(f"{BASE_URL}/api/meta-leads/webhook", json=invalid_phone_payload)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 5: Invalid object type
print("\n5. Testing invalid object_type:")
invalid_type_payload = {
    "object_type": "page",
    "lead_data": {
        "leadgen_id": "77777777777777777",
        "form_id": "form_test",
        "campaign_id": "campaign_test",
        "created_time": "2026-11-25T14:40:00Z",
        "full_name": "Another User",
        "phone_number": "9123456789"
    }
}

response = requests.post(f"{BASE_URL}/api/meta-leads/webhook", json=invalid_type_payload)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

print("\n" + "=" * 60)
print("Tests Complete!")
print("=" * 60)
