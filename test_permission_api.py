"""
Permission API 테스트 스크립트

TASK 2: Permission API 엔드포인트 테스트
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """서버 헬스 체크"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health", timeout=5)
        print(f"✅ Health Check: {response.status_code}")
        print(f"   Response: {response.json()}\n")
        return True
    except Exception as e:
        print(f"❌ Health Check Failed: {e}\n")
        return False

def test_permission_menus_without_auth():
    """인증 없이 메뉴 조회 (401 예상)"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/permissions/menus", timeout=5)
        print(f"📋 GET /api/v1/permissions/menus (No Auth)")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}\n")
    except Exception as e:
        print(f"❌ Request Failed: {e}\n")

def test_permission_positions_without_auth():
    """인증 없이 직책 목록 조회 (401 예상)"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/permissions/positions", timeout=5)
        print(f"👥 GET /api/v1/permissions/positions (No Auth)")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}\n")
    except Exception as e:
        print(f"❌ Request Failed: {e}\n")

def main():
    print("=" * 60)
    print("Permission API 테스트")
    print("=" * 60 + "\n")
    
    # 1. 서버 헬스 체크
    if not test_health():
        print("⚠️  서버가 실행 중이지 않습니다. 테스트를 중단합니다.")
        return
    
    # 2. Permission API 테스트 (인증 없이 - 401 예상)
    print("=" * 60)
    print("Permission API 엔드포인트 테스트 (인증 없음)")
    print("=" * 60 + "\n")
    
    test_permission_menus_without_auth()
    test_permission_positions_without_auth()
    
    print("=" * 60)
    print("테스트 완료")
    print("=" * 60)
    print("\n📝 참고:")
    print("- 401 Unauthorized는 정상입니다 (인증 필요)")
    print("- 404 Not Found가 나오면 라우터 등록 문제입니다")
    print("- Swagger UI: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
