module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type enum - 허용되는 커밋 타입
    'type-enum': [
      2,
      'always',
      [
        'feat', // 새로운 기능 추가
        'fix', // 버그 수정
        'docs', // 문서 수정
        'style', // 코드 포맷팅, 세미콜론 누락 등 (코드 변경 없음)
        'refactor', // 코드 리팩토링
        'perf', // 성능 개선
        'test', // 테스트 코드 추가/수정
        'build', // 빌드 시스템 또는 외부 종속성 변경
        'ci', // CI 구성 파일 및 스크립트 변경
        'chore', // 기타 변경사항 (빌드 프로세스, 패키지 매니저 등)
        'revert', // 이전 커밋 되돌리기
      ],
    ],
    // Type은 항상 소문자
    'type-case': [2, 'always', 'lower-case'],
    // Type은 비어있으면 안됨
    'type-empty': [2, 'never'],
    // Subject는 비어있으면 안됨
    'subject-empty': [2, 'never'],
    // Subject는 마침표로 끝나면 안됨
    'subject-full-stop': [2, 'never', '.'],
    // Subject는 대문자로 시작하지 않음
    'subject-case': [0],
    // Header(첫 줄)의 최대 길이
    'header-max-length': [2, 'always', 100],
  },
};
