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

### 2.1 커밋 타입

| 타입       | 설명                          | 예시                                  |
| ---------- | ----------------------------- | ------------------------------------- |
| `feat`     | 새로운 기능 추가              | feat: Add user login API              |
| `fix`      | 버그 수정                     | fix: Resolve authentication error     |
| `docs`     | 문서 수정                     | docs: Update README                   |
| `style`    | 코드 포맷팅, 세미콜론 누락 등 | style: Format code with Prettier      |
| `refactor` | 코드 리팩토링                 | refactor: Simplify user service logic |
| `test`     | 테스트 코드 추가/수정         | test: Add user login test cases       |
| `chore`    | 빌드, 패키지 매니저 설정 등   | chore: Update dependencies            |

### 2.2 커밋 메시지 형식

```
<타입>: <제목> (#이슈번호)

[부가 설명 - 선택사항]
```

### 2.3 작성 규칙

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

### 2.4 커밋 예시

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

### 2.5 나쁜 예시

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

템플릿 파일은 `.github/pull_request_template.md`를 참고하세요.

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
   - 리뷰어는 24시간 이내 응답
   - 수정 요청 시 즉시 반영
5. **머지**
   - 승인 후 "Squash and merge" 또는 "Merge pull request"
   - 브랜치 자동 삭제

### 3.5 코드 리뷰 가이드

### 리뷰어

- 코드 로직, 가독성, 성능, 보안 검토
- 건설적인 피드백 제공
- 24시간 이내 응답

### PR 작성자

- 리뷰 의견에 대한 답변 또는 수정
- 논쟁이 필요한 경우 별도 논의
- 모든 코멘트 해결 후 머지 요청

---

## 4. 이슈 관리

### 4.1 이슈 라벨

### 타입 라벨

| 라벨            | 설명                  | 색상    |
| --------------- | --------------------- | ------- |
| `bug`           | 버그 및 오류          | 🔴 빨강 |
| `enhancement`   | 새로운 기능 또는 개선 | 🔵 파랑 |
| `documentation` | 문서 관련             | 📘 초록 |

### 영역 라벨

| 라벨       | 설명            | 색상    |
| ---------- | --------------- | ------- |
| `frontend` | 프론트엔드 관련 | 💜 보라 |
| `backend`  | 백엔드 관련     | 💛 노랑 |

### 우선순위 라벨

| 라벨               | 설명                    | 색상    |
| ------------------ | ----------------------- | ------- |
| `priority: high`   | 긴급, 즉시 처리 필요    | 🔴 빨강 |
| `priority: medium` | 중요, 계획된 처리       | 🟡 노랑 |
| `priority: low`    | 낮음, 여유 있을 때 처리 | 🟢 초록 |

### 4.2 이슈 템플릿

이슈 템플릿은 다음 파일들을 참고하세요:

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`

### 4.3 이슈 생성 프로세스

1. **이슈 생성**
   - GitHub Issues 탭에서 "New issue" 클릭
   - 적절한 템플릿 선택
   - 내용 작성
2. **라벨 지정**
   - 타입, 영역, 우선순위 라벨 선택
   - 예: `bug`, `backend`, `priority: high`
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

> 모노레포는 사용하지 않습니다. 프론트엔드와 백엔드는 별도 레포지토리로 관리합니다.

---

## 6. 코드 스타일

### 6.1 코드 포맷팅

프로젝트는 다음 도구들을 사용하여 코드 스타일을 통일합니다:

- **Prettier**: 코드 포맷팅
- **ESLint**: 코드 품질 검사
- **EditorConfig**: 에디터 설정 통일

설정 파일:

- `.prettierrc` - Prettier 설정
- `.prettierignore` - Prettier 무시 파일
- `.eslintrc.js` - ESLint 설정
- `.editorconfig` - 에디터 설정

### 6.2 에디터 설정

VS Code 사용자를 위한 권장 설정은 `.vscode/settings.json`을 참고하세요.

### 6.3 Pre-commit Hook

코드 커밋 전 자동으로 린트와 포맷팅을 수행합니다.

필요한 패키지:

```bash
npm install -D husky lint-staged
```

설정 파일:

- `package.json` - lint-staged 설정 포함
- `.husky/pre-commit` - Husky pre-commit hook

---

## 7. 문서화

### 7.1 README.md 필수 항목

모든 프로젝트는 다음 내용을 포함한 README.md를 작성합니다:

1. **프로젝트 소개**
   - 프로젝트명
   - 한 줄 설명
   - 상세 설명

2. **기술 스택**
   - Frontend 기술
   - Backend 기술
   - 데이터베이스 등

3. **설치 방법**
   - 요구사항
   - 설치 명령어
   - 환경 변수 설정

4. **실행 방법**
   - 개발 모드
   - 빌드
   - 프로덕션 모드
   - 테스트

5. **API 문서** (백엔드의 경우)
   - Swagger UI 링크 등

6. **기여 방법**
   - CONTRIBUTING.md 링크

7. **라이선스**

8. **팀원**

### 7.2 CONTRIBUTING.md

기여 가이드는 별도의 CONTRIBUTING.md 파일로 관리합니다.

### 7.3 프로젝트 위키

GitHub Wiki 또는 Notion에 다음 내용 정리:

- 아키텍처 설계
- API 명세
- 데이터베이스 스키마
- 배포 가이드
- 트러블슈팅 가이드

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

- Notion 또는 Google Docs 사용

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

- **작성 담당**: 회의마다 순번제
- **보관 위치**: 팀 Notion 워크스페이스
- **공유**: 회의 후 24시간 이내 공유

### 8.3 커뮤니케이션 채널

### Discord/Slack 채널 구조

| 채널            | 용도                   |
| --------------- | ---------------------- |
| `#general`      | 일상 소통, 공지사항    |
| `#dev-frontend` | 프론트엔드 기술 논의   |
| `#dev-backend`  | 백엔드 기술 논의       |
| `#code-review`  | 코드 리뷰 알림 및 논의 |
| `#bugs`         | 버그 리포트 및 논의    |
| `#deployment`   | 배포 관련 공지         |
| `#random`       | 자유 주제              |

### 응답 시간 가이드

- **일반 질문**: 당일 또는 익일 응답
- **긴급 이슈**: 1시간 이내 응답
- **코드 리뷰**: 24시간 이내 응답

### 멘션 사용

- `@all`: 전체 공지 (신중하게 사용)
- `@here`: 온라인 멤버 공지
- `@username`: 특정 멤버 호출
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

이 컨벤션은 고정된 것이 아닙니다.

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

- Discord/Slack `#general` 채널에 문의
- GitHub Discussions 활용
- 팀 회의에서 안건으로 제기

---

**최종 수정일**: 2024-11-19

**버전**: 1.0.0
