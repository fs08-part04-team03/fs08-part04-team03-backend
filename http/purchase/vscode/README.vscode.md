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
│   ├── purchaseNow.http           # IntelliJ용
│   ├── purchaseNow.vscode.http    # VSCode용
│   ├── getAllPurchases.http       # IntelliJ용
│   ├── getAllPurchases.vscode.http # VSCode용
│   ├── getMyPurchases.http        # IntelliJ용
│   └── getMyPurchases.vscode.http # VSCode용
└── README.vscode.md
http-client.env.json               # VSCode 환경 변수 설정
```

## 주의사항

- IntelliJ의 자동 토큰 저장 기능(`> {% client.global.set() %}`)은 VSCode에서 지원되지 않습니다
- 토큰은 수동으로 복사하여 설정해야 합니다
- `http-client.env.json` 파일은 `.gitignore`에 추가하여 토큰이 Git에 커밋되지 않도록 주의하세요
