"""
Permission API 테스트 (표준 라이브러리 사용)

1. 임의의 JWT 토큰 생성
2. GET /api/v1/permissions/positions 호출 (Authorization 헤더 포함)
3. 응답 확인 (SESSION_NOT_FOUND 또는 Unauthorized면 성공 - 헤더 누락 에러가 아니므로)
"""

import sys
import json
import http.client
from datetime import datetime, timedelta

# 프로젝트 루트를 sys.path에 추가하여 server 모듈 import 가능하게 함
import os
sys.path.append(os.getcwd())

from server.app.core.security import create_access_token

def test_permission_api():
    print("=" * 60)
    print("Permission API 헤더 전달 테스트")
    print("=" * 60)
    
    # 1. 임의의 토큰 생성 (DB에 없는 세션이라도)
    payload = {
        "user_id": "test_user_id",
        "session_id": "dummy_session_id", # DB에 없으므로 SESSION_NOT_FOUND 예상
        "role": "R002",
        "sub": "test@example.com"
    }
    
    try:
        token = create_access_token(payload)
        print(f"✅ 토큰 생성 성공: {token[:20]}...")
    except Exception as e:
        print(f"❌ 토큰 생성 실패: {e}")
        return

    # 2. API 호출
    conn = http.client.HTTPConnection("localhost", 8000)
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    print("\n[Request]")
    print(f"GET /api/v1/permissions/positions")
    print(f"Headers: Authorization: Bearer {token[:20]}...")
    
    try:
        conn.request("GET", "/api/v1/permissions/positions", headers=headers)
        response = conn.getresponse()
        data = response.read().decode("utf-8")
        
        print("\n[Response]")
        print(f"Status: {response.status}")
        try:
            json_data = json.loads(data)
            print(f"Body: {json.dumps(json_data, indent=2, ensure_ascii=False)}")
            
            # 결과 분석
            if response.status == 200:
                print("\n✅ API 호출 성공! (운 좋게 DB에 세션이 있거나 로직 통과)")
            elif response.status == 401:
                detail = json_data.get("detail", "")
                if isinstance(detail, dict) and detail.get("error_code") == "SESSION_NOT_FOUND":
                    print("\n✅ 테스트 성공: 헤더가 정상적으로 전달되었습니다.")
                    print("   (SESSION_NOT_FOUND 에러는 DB에 세션이 없어서 발생하는 정상적인 에러입니다)")
                elif "header missing" in str(detail):
                    print("\n❌ 테스트 실패: 여전히 'Authorization header missing' 에러가 발생합니다.")
                else:
                    print(f"\n✅ 테스트 성공: 헤더가 전달되었으나 다른 이유로 거부됨 ({detail})")
            else:
                print(f"\nExample Code: {response.status}")
                
        except json.JSONDecodeError:
            print(f"Body: {data}")
            
    except Exception as e:
        print(f"\n❌ 요청 실패: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_permission_api()
