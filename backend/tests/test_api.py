import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Generate unique email for testing
import time
test_id = int(time.time()) % 100000
TEST_EMAIL = f"qa_{test_id}@accutai.com"
TEST_USER = f"qa_{test_id}"
TEST_PASSWORD = "testpassword123"

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_register_invalid_domain():
    response = client.post("/users/", json={
        "username": "invalid_user",
        "email": "user@gmail.com",
        "password": "password123"
    })
    assert response.status_code == 422 or response.status_code == 400

def test_register_and_login_flow():
    # 1. Register valid accutai user
    reg_resp = client.post("/users/", json={
        "username": TEST_USER,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert data["email"] == TEST_EMAIL

    # 2. Login with credentials
    login_resp = client.post("/login", json={
        "username": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Read current user
    me_resp = client.get("/users/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == TEST_EMAIL

    # 4. Get categories (shared)
    cat_resp = client.get("/categories/", headers=headers)
    assert cat_resp.status_code == 200
    categories = cat_resp.json()
    assert len(categories) > 0
    first_cat_id = categories[0]["id"]

    # 5. Create a transaction
    tx_resp = client.post("/transactions/", headers=headers, json={
        "amount": 250.75,
        "type": "expense",
        "description": "Team Cloud Servers",
        "date": "2026-09-02T10:00:00Z",
        "category_id": first_cat_id
    })
    assert tx_resp.status_code == 201
    created_tx = tx_resp.json()
    assert created_tx["amount"] == "250.75"
    tx_id = created_tx["id"]

    # 6. Read shared transactions
    list_resp = client.get("/transactions/?year=2026&month=9", headers=headers)
    assert list_resp.status_code == 200
    tx_list = list_resp.json()
    assert any(t["id"] == tx_id for t in tx_list)

    # 7. Check shared budget status
    budget_resp = client.get("/budget?year=2026&month=9", headers=headers)
    assert budget_resp.status_code == 200
    budget_data = budget_resp.json()
    assert "total_budget" in budget_data
    assert budget_data["total_spent"] >= 250.75

    # 8. Monthly report
    report_resp = client.get("/reports/monthly/?year=2026&month=9", headers=headers)
    assert report_resp.status_code == 200
    report = report_resp.json()
    assert report["total_expense"] >= 250.75

    # 9. Clean up test transaction
    del_resp = client.delete(f"/transactions/{tx_id}", headers=headers)
    assert del_resp.status_code == 200
