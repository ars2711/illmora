from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Ilmora API", "status": "operational"}

def test_openapi_schema():
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    assert "openapi" in response.json()

# Note: More complex tests requiring DB mocks would go here.
# For Phase 4, we ensure the app boots and serves schema.
