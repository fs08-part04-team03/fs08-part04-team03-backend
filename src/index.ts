// ========================================
// TypeScript 프로젝트 엔트리 포인트
// ========================================

/**
 * 환경 변수 타입 정의
 */
interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
}

/**
 * 환경 변수 로드
 */
const getConfig = (): EnvConfig => ({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
});

/**
 * 서버 시작 함수
 */
const startServer = (config: EnvConfig): void => {
  console.log('🚀 서버 시작...');
  console.log(`📌 환경: ${config.NODE_ENV}`);
  console.log(`📌 포트: ${config.PORT}`);
  console.log('✅ 서버가 성공적으로 시작되었습니다!');
  console.log(`🔗 http://localhost:${config.PORT}`);
};

/**
 * 메인 함수
 */
const main = (): void => {
  try {
    const config = getConfig();
    startServer(config);
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 프로그램 실행
main();
