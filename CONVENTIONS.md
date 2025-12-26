# 개발 컨벤션

## 📋 목차

- [Git & 브랜치 관리](#1-git--브랜치-관리)
- [커밋 메시지](#2-커밋-메시지)
- [Pull Request](#3-pull-request)
- [이슈 관리](#4-이슈-관리)
- [개발 환경](#5-개발-환경)
- [코드 스타일](#6-코드-스타일)
- [문서화](#7-문서화)
- [커뮤니케이션](#8-커뮤니케이션)

---

## 1. Git & 브랜치 관리

### 1.1 브랜치 전략

### 메인 브랜치

- `main`: 운영 환경 배포 브랜치
- `develop`: 개발 환경 통합 브랜치

### 브랜치 네이밍 규칙

**기능 개발**

```
feature/이슈번호-기능명
```

예시:

- `feature/123-user-login`
- `feature/456-payment-module`

**긴급 수정**

```
hotfix/이슈번호-수정내용
```

예시:

- `hotfix/789-login-bug`
- `hotfix/101-security-patch`

### 1.2 브랜치 워크플로우

```
main (운영)
  ↑ merge
develop (개발)
  ↑ merge
feature/123-login (기능 개발)
```

### 1.3 브랜치 관리 규칙

1. **브랜치 생성**

   ```bash
   # develop 브랜치에서 최신 코드 받기
   git checkout develop
   git pull origin develop

   # 새 브랜치 생성
   git checkout -b feature/123-user-login
   ```

2. **브랜치 삭제**

- PR 머지 후 **자동 삭제** 설정
- GitHub에서 "Automatically delete head branches" 옵션 활성화

3. **작업 완료 후**

   ```bash
   # develop 브랜치로 PR 생성
   git push origin feature/123-user-login
   ```

---

## 2. 커밋 메시지

### 2.1 커밋 타입: 해당 타입을 사용하지 않을 경우, 커밋이 중단됨

| 타입       | 설명                              | 예시                                  |
| ---------- | --------------------------------- | ------------------------------------- |
| `feat`     | 새로운 기능 추가                  | feat: Add user login API              |
| `fix`      | 버그 수정                         | fix: Resolve authentication error     |
| `docs`     | 문서 수정                         | docs: Update README                   |
| `style`    | 코드 포맷팅, 세미콜론 누락 등     | style: Format code with Prettier      |
| `refactor` | 코드 리팩토링                     | refactor: Simplify user service logic |
| `perf`     | 성능 개선                         | perf: Enhancement performance         |
| `test`     | 테스트 코드 추가/수정             | test: Add user login test cases       |
| `build`    | 빌드 시스템 또는 외부 종속성 변경 | build: Update dependencies            |
| `ci`       | CI 구성 파일 및 스크립트 변경     | ci: Update action workflow            |
| `chore`    | 빌드, 패키지 매니저 설정 등       | chore: Add document                   |
| `revert`   | 이전 커밋 되돌리기                | revert: Wrong Commits (#커밋해시)     |

### 2.2 커밋 메시지 형식

```
<타입>: <제목> (#이슈번호)

[부가 설명 - 필수 사항]
```

### 2.3 커밋 검사 규칙: 미 준수 시, 커밋이 중단됨

- Type은 항상 소문자
- Type은 비어있으면 안됨
- Subject는 비어있으면 안됨
- Subject는 마침표로 끝나면 안됨
- Subject는 대문자로 시작하지 않음
- Header(첫 줄)의 최대 길이: 100

### 2.4 작성 규칙

### 제목 (Title)

- **영어**로 작성
- **동사 원형**으로 시작 (Add, Fix, Update 등)
- **50자 이내**로 작성
- **마침표 없음**
- 이슈 번호 포함: `(#123)`

### 본문 (Body)

- **한글** 허용
- 제목과 본문 사이 **빈 줄** 추가
- **72자**마다 줄바꿈
- "왜" 변경했는지 설명
- 선택사항 (간단한 커밋은 생략 가능)

### 2.5 커밋 예시

**간단한 커밋**

```bash
feat: Add user login API (#123)
```

**상세한 커밋**

```bash
feat: Add user login API (#123)

사용자 로그인 기능을 구현했습니다.
- JWT 토큰 기반 인증 사용
- 비밀번호는 bcrypt로 암호화
- 리프레시 토큰 발급 로직 포함
```

**버그 수정**

```bash
fix: Resolve token refresh error (#456)

토큰 갱신 시 발생하던 401 에러를 수정했습니다.
만료된 리프레시 토큰 검증 로직을 추가했습니다.
```

### 2.6 나쁜 예시

```bash
❌ 로그인 추가               # 한글 제목
❌ add login                # 이슈 번호 누락
❌ feat: 로그인 기능 추가.    # 마침표, 한글 제목
❌ Add Login Feature        # 타입 누락
```

---

## 3. Pull Request

### 3.1 PR 제목

**커밋 메시지와 동일한 형식**을 사용합니다.

```
<타입>: <제목> (#이슈번호)
```

예시:

- `feat: Add user authentication (#123)`
- `fix: Resolve database connection error (#456)`

### 3.2 PR 규칙

| 항목               | 규칙                          |
| ------------------ | ----------------------------- |
| **리뷰어 지정**    | 수동으로 지정                 |
| **최소 승인 인원** | 1명 이상                      |
| **셀프 리뷰**      | ❌ 허용하지 않음              |
| **리뷰 응답 기한** | 24시간 이내 (영업일 기준)     |
| **타겟 브랜치**    | `develop` (운영 배포: `main`) |

### 3.3 PR 템플릿

```markdown
## 📝 변경사항

<!-- 무엇을 변경했는지 간단히 설명해주세요 -->

## 🔨 작업 내용

- [ ] 작업 내용 1
- [ ] 작업 내용 2
- [ ] 작업 내용 3

## 🧪 테스트 방법

<!-- 어떻게 테스트했는지 설명해주세요 -->

1.
2.
3.

## 📸 스크린샷 (UI 변경 시)

<!-- UI 변경이 있다면 Before/After 스크린샷을 첨부해주세요 -->

| Before | After  |
| ------ | ------ |
| 이미지 | 이미지 |

## ✅ 체크리스트

- [ ] 코드 스타일 가이드를 준수했습니다
- [ ] 주요 로직에 주석을 작성했습니다
- [ ] 테스트 코드를 작성했습니다
- [ ] 문서를 업데이트했습니다 (필요 시)
- [ ] 이슈를 연결했습니다

## 🔗 관련 이슈

Closes #이슈번호
```

### 3.4 PR 생성 프로세스

1. **브랜치 푸시**

   ```bash
   git push origin feature/123-user-login
   ```

2. **PR 생성**

- GitHub에서 "New Pull Request" 클릭
- `develop` ← `feature/123-user-login`
- 템플릿에 따라 내용 작성

3. **리뷰어 지정**

- 팀원 중 1명 이상 지정
- 본인은 리뷰어로 지정 불가

4. **코드 리뷰**

- CodeRabbit을 통해 자동으로 코드 리뷰 수행
- 작성자는 리뷰에 따른 수정 사항 수정
- 수정이 완료됐을 경우, 팀원은 24시간 이내 Merge

5. **머지**

- 승인 후 "Squash and merge" 또는 "Merge pull request"
- 사용한 브랜치 삭제

### 3.5 코드 리뷰 가이드

### 자동화 도구

- OSV-Scanner (develop, main)와 CodeQL (main)이 패키지와 코드의 취약점을 찾아줌
- CodeRabbit을 통해, AI에 기반한 코드리뷰를 받을 수 있음
- 자동화 도구는 실행되는데 시간이 걸림

### 팀원

- 자동화 도구의 요구사항/수정사항을 만족할 경우, PR을 Merge
- 24시간 이내 응답할 수 있도록 함

### PR 작성자

- 리뷰 의견에 대한 답변 또는 수정
- 논쟁이 필요한 경우 별도 논의
- 모든 코멘트 해결 후 머지 요청

---

## 4. 이슈 관리: 기술 관련 요구 사항 신청

### 4.1 이슈 라벨

### 타입 라벨

| 라벨            | 설명                  | 색상    |
| --------------- | --------------------- | ------- |
| `bug`           | 버그 및 오류          | 🔴 빨강 |
| `enhancement`   | 새로운 기능 또는 개선 | 🔵 파랑 |
| `documentation` | 문서 관련             | 📘 초록 |

### 4.2 이슈 템플릿

### 버그 리포트

```markdown
---
name: 버그 리포트
about: 버그를 제보할 때 사용하세요
labels: bug
---

## 🐛 버그 설명

<!-- 어떤 버그인지 간단히 설명해주세요 -->

## 📋 재현 방법

1.
2.
3.
4.

## ✅ 예상 동작

<!-- 어떻게 동작해야 하는지 설명해주세요 -->

## ❌ 실제 동작

<!-- 실제로 어떻게 동작하는지 설명해주세요 -->

## 📸 스크린샷

<!-- 가능하다면 스크린샷을 첨부해주세요 -->

## 💻 환경

- OS: [예: Windows 11, macOS 14]
- 브라우저: [예: Chrome 120, Safari 17]
- Node.js 버전: [예: 18.17.0]

## 📝 추가 정보

<!-- 기타 참고할 만한 정보가 있다면 작성해주세요 -->
```

### 기능 요청

```markdown
---
name: 기능 요청
about: 새로운 기능을 제안할 때 사용하세요
labels: enhancement
---

## 💡 기능 설명

<!-- 어떤 기능을 추가하고 싶은지 설명해주세요 -->

## 🎯 사용 사례

<!-- 이 기능이 어떤 상황에서 필요한지 설명해주세요 -->

## 📌 제안하는 해결 방법

<!-- 어떻게 구현하면 좋을지 제안해주세요 (선택사항) -->

## 🔄 대안

<!-- 고려해본 다른 방법이 있다면 작성해주세요 (선택사항) -->

## 📝 추가 정보

<!-- 기타 참고할 만한 정보가 있다면 작성해주세요 -->
```

### 4.3 이슈 생성 프로세스

1. **이슈 생성**

- GitHub Issues 탭에서 "New issue" 클릭
- 적절한 템플릿 선택
- 내용 작성

2. **라벨 지정**

- 타입 라벨 선택
- 예: `bug`

3. **담당자 배정**

- Assignees에서 담당자 지정
- 미정인 경우 추후 배정

4. **프로젝트 연결** (선택)

- GitHub Projects와 연결 (사용 시)

---

## 5. 개발 환경

### 5.1 필수 버전

| 항목        | 버전          |
| ----------- | ------------- |
| **Node.js** | 18.x LTS 이상 |
| **npm**     | 9.x 이상      |

### 5.2 패키지 매니저

**npm**을 사용합니다.

```bash
# 패키지 설치
npm install

# 패키지 추가
npm install <package-name>

# 개발 의존성 추가
npm install -D <package-name>
```

### 5.3 프로젝트 구조

```
project-root/
├── frontend/           # 프론트엔드 프로젝트
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/            # 백엔드 프로젝트
│   ├── src/
│   ├── package.json
│   └── ...
├── docs/               # 문서
└── README.md
```

---

## 6. 코드 스타일

### 6.1 Prettier 설정

**`.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5",
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**`.prettierignore`**

```
node_modules
dist
build
.next
coverage
*.log
```

### 6.2 ESLint 설정

**`.eslintrc.js`**

```javascript
module.exports = {
  extends: ['airbnb', 'airbnb/hooks', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    // 프로젝트별 커스텀 룰 추가
  },
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
};
```

### 6.3 에디터 설정

**`.editorconfig`**

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

### 6.4 VS Code 설정 (권장)

**`.vscode/settings.json`**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.tabSize": 2
}
```

### 6.5 Pre-commit Hook

**Husky + lint-staged 설정**

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**`.husky/pre-commit`**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

---

## 7. 문서화

### 7.1 README.md 필수 항목

````markdown
# 프로젝트명

> 프로젝트에 대한 간단한 한 줄 설명

## 📖 프로젝트 소개

프로젝트에 대한 상세한 설명을 작성합니다.

## 🛠 기술 스택

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Backend

- Express
- TypeScript
- PostgreSQL

## 📦 설치 방법

### 요구사항

- Node.js 18.x 이상
- PostgreSQL 14 이상

### 설치

```bash
# 레포지토리 클론
git clone https://github.com/username/project.git

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
```
````

## 🔧 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```
# 데이터베이스
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp

# JWT
JWT_SECRET=your-secret-key

# 서버
PORT=3000
```

자세한 내용은 `.env.example` 파일을 참고하세요.

## 🚀 실행 방법

### 개발 모드

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 프로덕션 모드

```bash
npm start
```

### 테스트

```bash
npm test
```

## 📚 API 문서

API 문서는 다음 경로에서 확인할 수 있습니다:

- Swagger UI: http://localhost:3000/api-docs

## 🤝 기여 방법

기여 방법은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👥 팀원

- 홍길동 ([@github-id](https://github.com/github-id)) - Frontend
- 김철수 ([@github-id](https://github.com/github-id)) - Backend

````

### 7.2 CONTRIBUTING.md

```markdown
# 기여 가이드

이 프로젝트에 기여해주셔서 감사합니다! 🎉

## 개발 프로세스

1. 이슈 생성 또는 기존 이슈 선택
2. 브랜치 생성 (`feature/이슈번호-기능명`)
3. 코드 작성 및 커밋
4. Pull Request 생성
5. 코드 리뷰
6. 머지

## 커밋 규칙

커밋 메시지는 다음 형식을 따릅니다:

````

<타입>: <제목> (#이슈번호)

[부가 설명]

```

자세한 내용은 [공통 컨벤션 문서](docs/conventions.md)를 참고하세요.

## 코드 리뷰

- 모든 PR은 최소 1명의 승인이 필요합니다
- 리뷰어는 24시간 이내 응답합니다
- 건설적인 피드백을 제공해주세요

## 질문하기

궁금한 점이 있다면:
- Discord/Slack 개발 채널에 질문
- GitHub Discussions 활용
- 이슈로 질문 등록

## 행동 강령

- 서로 존중하며 협력합니다
- 건설적인 피드백을 제공합니다
- 다양성을 존중합니다
```

---

## 8. 커뮤니케이션

### 8.1 긴급 수정 프로세스

긴급한 버그 발생 시:

1. **hotfix 브랜치 생성**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/이슈번호-수정내용
   ```

2. **수정 및 커밋**

   ```bash
   git add .
   git commit -m "fix: Resolve critical bug (#이슈번호)"
   git push origin hotfix/이슈번호-수정내용
   ```

3. **긴급 PR 생성**

- `main` ← `hotfix/이슈번호-수정내용`
- PR 제목에 `[HOTFIX]` 접두사 추가
- 팀원에게 즉시 알림 (Slack/Discord 멘션)

4. **빠른 리뷰 및 머지**

- 리뷰어는 최대한 빠르게 검토
- 승인 후 즉시 `main`에 머지

5. **develop 동기화**

   ```bash
   git checkout develop
   git pull origin develop
   git merge main
   git push origin develop
   ```

### 8.2 회의록 관리

### 작성 도구

- Notion 사용

### 회의록 템플릿

```markdown
# 회의록 - YYYY-MM-DD

## 참석자

- 홍길동
- 김철수
- 이영희

## 안건

1. 안건 1
2. 안건 2

## 논의 내용

### 안건 1

- 논의 내용 요약
- 결정 사항

### 안건 2

- 논의 내용 요약
- 결정 사항

## 액션 아이템

- [ ] 담당자: 할 일 1 (마감일)
- [ ] 담당자: 할 일 2 (마감일)

## 다음 회의

- 일시: YYYY-MM-DD HH:MM
- 안건:
```

### 관리 방법

- **보관 위치**: 팀 Notion 워크스페이스
- **공유**: 회의 후 24시간 이내 공유

### 8.3 커뮤니케이션 채널

### Discord 채널 구조

| 채널           | 용도                   |
| -------------- | ---------------------- |
| `#공지사항`    | 공지사항               |
| `#github-알림` | 코드 리뷰 알림 및 논의 |
| `#일반`        | 기타 사항 논의         |
| `#프론트엔드`  | 프론트엔드 기술 논의   |
| `#백엔드`      | 백엔드 기술 논의       |
| `#회의실`      | 음성/영상 회의실       |

### 멘션 사용

- `@Team`: 전체 호출 (멘토님, 원장님 제외)
- `@Team Leader`: 팀장 호출
- `@Lead`: 리드 호출
- `@Frontend`: 프론트엔드 멤버 호출 (리드 포함)
- `@Backend`: 백엔드 멤버 호출 (리드 포함)
- `@here`: 온라인 멤버 공지
- 긴급한 경우: 전화 또는 DM

### 8.4 업무 시간

### 코어 타임

- 평일 9:00 - 19:00
- 이 시간대는 가급적 응답 가능하도록 유지

### 비동기 작업

- 코어 타임 외에는 비동기 작업
- 긴급한 경우가 아니면 즉각 응답 불필요

---

## 📌 참고사항

### 컨벤션 개선

- 이 컨벤션은 고정된 것이 아닙니다.
- 이 컨벤션은 실제와 내용이 다를 수 있습니다. 이 경우, 팀장에게 문의해주세요.

**정기 회고** (2주마다):

- 불편한 점 공유
- 개선 제안 논의
- 합의 후 문서 업데이트

**실험적 접근**:

- 확신이 없으면 2주간 시도
- 평가 후 유지 또는 변경

**목표**: "완벽한 컨벤션"보다 "우리 팀에 맞는 컨벤션" 만들기

### 문의

컨벤션 관련 질문이나 제안이 있다면:

- Discord 일반 채널에 문의
- 팀 스크럼에서 안건으로 제기

---

**최종 수정일**: 2025-11-20

**버전**: 1.0.0
