#!/bin/bash

echo "======================================"
echo "JWT 토큰 발급 테스트"
echo "======================================"
echo ""
echo "1. 서버 시작:"
echo "   cd server && python -m uvicorn app.main:app --reload --port 8000"
echo ""
echo "2. 클라이언트 시작:"
echo "   cd client && npm run dev"
echo ""
echo "3. 브라우저 접속:"
echo "   http://localhost:3000/login"
echo ""
echo "4. Google 로그인 후 개발자 도구(F12)에서 응답 확인"
echo ""
echo "예상 응답:"
echo "{"
echo '  "success": true,'
echo '  "access_token": "eyJhbGc...",'
echo '  "token_type": "bearer",'
echo '  "user_id": "your.email",'
echo '  "email": "your.email@gmail.com",'
echo '  "name": "Your Name",'
echo '  "role": "HR",'
echo '  "position": "TEAM_LEADER"'
echo "}"
echo ""
echo "======================================"
