import requests
import json
import sys

TOKEN = '8804491050:AAHUMbdQTjBx03fKSbvBH0isYqI8MbxhnXE'
CHAT_ID = 7109320108

questions = """🚀 **[유어투두] 할 일 강제 토스 및 실시간 추적 기능 구현을 위한 기획/개발 정렬 인터뷰**

안녕하세요 사장님! 신규 MCP 인프라 검증 및 코드 분석을 완료하고, 핵심 기능 구현을 위한 인터뷰 질문지를 발송해 드립니다. 아래 각 항목에 대해 의견을 주시면 설계에 반영하겠습니다.

---

### 1. 할 일 강제 토스(Forced Toss) 대상 지정 방식
*   **[Q1]** 강제 토스를 할 때 대상을 어떻게 지정해야 할까요?
    *   옵션 A: 가입된 전체 사용자 목록(Nickname 기준)에서 선택하여 직접 토스.
    *   옵션 B: 상대방의 고유 Sync ID 또는 사용자 식별키(UID)를 직접 입력하여 토스.
    *   옵션 C: 기존처럼 공유 링크를 생성하여 발송한 후, 상대방이 링크를 여는 순간 즉시 강제 할당.

### 2. 실시간 추적(Tracking) 워크플로우 & 상태 관리
*   **[Q2]** `firebase-rules.json`에 정의된 `tracking_status` (`pending`, `accepted`, `completed`) 흐름은 어떻게 작동해야 할까요?
    *   예시 흐름:
        1.  발신자가 토스함 ➔ `pending` (대기 중)
        2.  수신자가 승인함/확인함 ➔ `accepted` (진행 중)
        3.  수신자가 완료함 ➔ `completed` (완료)
    *   *수정 사항이나 특별히 추가하고 싶으신 상태(예: 거절/반려 등)가 있으신가요?*

### 3. 알림(Notification) 및 연동 방식
*   **[Q3]** 실시간 추적 알림은 어떤 매체를 통해 전송되어야 할까요? (중복 선택 가능)
    *   옵션 A: FCM 웹 푸시 알림 (브라우저 푸시 알림 + 소리/진동 알림).
    *   옵션 B: 텔레그램 봇을 통한 실시간 메시지 전송 (알림 연동).
    *   옵션 C: 서비스 내의 인앱(In-app) 실시간 토스트 팝업 알림.

### 4. DB 스키마 및 보안 규칙 정의
*   **[Q4]** Firebase DB에 새로 적용된 규칙에서 `assigned_to` 및 `tracking_status` 필드를 사용하고 있습니다. 기존 `todos` 컬렉션의 `assigneeName`/`assigneeId`와 연계해 어떻게 구조를 가져갈까요?
    *   옵션 A: `todos` 문서 내에 `assigned_to`와 `tracking_status` 필드를 추가하여 직접 단일 문서로 관리.
    *   옵션 B: 별도의 `tossed_tasks` 또는 `tracking_history` 컬렉션을 생성하여 토스 이력을 별도 관리.

---
💡 답변은 편하게 번호나 텍스트로 적어서 텔레그램이나 현재 대화창에 남겨주시면, 검토 후 코딩 단계(Developer Agent)로 즉시 진입하겠습니다!
"""

url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
payload = {
    "chat_id": CHAT_ID,
    "text": questions,
    "parse_mode": "Markdown"
}

print("Starting to send request to Telegram...", flush=True)
try:
    response = requests.post(url, json=payload, timeout=10)
    print("Response status code:", response.status_code, flush=True)
    print("Response payload:", response.text, flush=True)
    if response.status_code == 200:
        print("SUCCESS", flush=True)
    else:
        print("FAILED", flush=True)
        sys.exit(1)
except Exception as e:
    print("Error occurred:", str(e), flush=True)
    sys.exit(1)
