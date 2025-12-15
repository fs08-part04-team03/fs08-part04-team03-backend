# VSCode REST Client 사용 방법

이 폴더에는 IntelliJ와 VSCode 두 가지 형식의 HTTP 파일이 있습니다:

- `*.http` - IntelliJ IDEA용
- `*.vscode.http` - VSCode REST Client용

## VSCode에서 사용하기

### 1. REST Client 확장 설치

VSCode에서 "REST Client" 확장을 설치하세요.

- 확장 ID: `humao.rest-client`

### 2. 토큰 설정 방법 (2가지 옵션)

#### 옵션 A: http-client.env.json 사용 (권장)

1. 프로젝트 루트의 `http-client.env.json` 파일을 열기
2. 로그인 요청을 실행하여 토큰 받기
3. `dev.token` 값을 받은 토큰으로 업데이트

```json
{
  "dev": {
    "baseUrl": "http://localhost:4000",
    "token": "실제_토큰_값"
  }
}
```

4. VSCode 하단의 환경 선택에서 "dev" 선택

#### 옵션 B: 파일 내 변수 사용

1. `.vscode.http` 파일을 열기
2. 로그인 요청을 실행
3. 응답에서 `accessToken` 복사
4. 파일 내의 `@token = YOUR_ACCESS_TOKEN_HERE` 부분을 업데이트

```http
@token = <YOUR_ACCESS_TOKEN_HERE>
```

### 3. 요청 실행

- 요청 위에 나타나는 "Send Request" 링크 클릭
- 또는 `Ctrl+Alt+R` (Windows/Linux) / `Cmd+Alt+R` (Mac)

## 파일 구조

```text
http/
├── purchase/
│   ├── vscode/
│   │   ├── purchaseNow.http              # 즉시 구매 API (관리자)
│   │   ├── getAllPurchases.http          # 전체 구매 내역 조회 API (관리자)
│   │   ├── getMyPurchases.http           # 내 구매 내역 조회 API
│   │   ├── managePurchaseRequests.http   # 구매 요청 관리 API (관리자)
│   │   ├── approvePurchaseRequest.http   # 구매 요청 승인 API (관리자)
│   │   ├── rejectPurchaseRequest.http    # 구매 요청 반려 API (관리자)
│   │   ├── requestPurchase.http          # 구매 요청 API
│   │   ├── getPurchaseDashboard.http     # 구매 관리 대시보드 API (관리자) 🆕
│   │   └── README.vscode.md              # 이 파일
│   └── intellij/
│       ├── (동일한 파일들 - IntelliJ용)
│       └── getPurchaseDashboard.http     # 🆕
└── http-client.env.json                  # VSCode 환경 변수 설정
```

## API 목록

### 관리자 전용 API (MANAGER 권한 필요)

- `purchaseNow.http` - 즉시 구매 (승인 없이 바로 구매)
- `getAllPurchases.http` - 전체 구매 내역 조회
- `managePurchaseRequests.http` - 구매 요청 조회/관리
- `approvePurchaseRequest.http` - 구매 요청 승인
- `rejectPurchaseRequest.http` - 구매 요청 반려
- `getPurchaseDashboard.http` - 구매 관리 대시보드 🆕
  - 이번달/지난달 지출액
  - 올해/작년 총 지출액
  - 이번달 예산 및 남은 예산
  - 승인된 구매 내역 리스트 (페이지네이션)

### 일반 사용자 API (USER 권한)

- `getMyPurchases.http` - 내 구매 내역 조회
- `requestPurchase.http` - 구매 요청 (승인 대기)

## 주의사항

- IntelliJ의 자동 토큰 저장 기능(`> {% client.global.set() %}`)은 VSCode에서 지원되지 않습니다
- 토큰은 수동으로 복사하여 설정해야 합니다
- `http-client.env.json` 파일은 `.gitignore`에 추가하여 토큰이 Git에 커밋되지 않도록 주의하세요
