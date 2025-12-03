import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

// ============================================================================
// 시드 데이터 정의
// ============================================================================

// 상위 카테고리 (ID: 1-7)
const mainCategories = [
  { id: 1, name: '스낵' },
  { id: 2, name: '음료' },
  { id: 3, name: '생수' },
  { id: 4, name: '간편식' },
  { id: 5, name: '신선식' },
  { id: 6, name: '원두커피' },
  { id: 7, name: '비품' },
];

// 하위 카테고리 (ID: 101~ , parentCategoryId로 상위 카테고리 참조)
const subCategories = [
  // 스낵 (parentCategoryId: 1) - 8개
  { id: 101, name: '과자', parentCategoryId: 1 },
  { id: 102, name: '쿠키', parentCategoryId: 1 },
  { id: 103, name: '비스켓류', parentCategoryId: 1 },
  { id: 104, name: '초콜릿류', parentCategoryId: 1 },
  { id: 105, name: '캔디류', parentCategoryId: 1 },
  { id: 106, name: '젤리류', parentCategoryId: 1 },
  { id: 107, name: '시리얼바', parentCategoryId: 1 },
  { id: 108, name: '견과류', parentCategoryId: 1 },

  // 음료 (parentCategoryId: 2) - 6개
  { id: 201, name: '탄산음료', parentCategoryId: 2 },
  { id: 202, name: '과즙음료', parentCategoryId: 2 },
  { id: 203, name: '에너지음료', parentCategoryId: 2 },
  { id: 204, name: '이온음료', parentCategoryId: 2 },
  { id: 205, name: '건강음료', parentCategoryId: 2 },
  { id: 206, name: '차류', parentCategoryId: 2 },

  // 생수 (parentCategoryId: 3) - 2개
  { id: 301, name: '생수', parentCategoryId: 3 },
  { id: 302, name: '스파클링', parentCategoryId: 3 },

  // 간편식 (parentCategoryId: 4) - 5개
  { id: 401, name: '컵라면', parentCategoryId: 4 },
  { id: 402, name: '소시지', parentCategoryId: 4 },
  { id: 403, name: '계란', parentCategoryId: 4 },
  { id: 404, name: '컵밥류', parentCategoryId: 4 },
  { id: 405, name: '시리얼', parentCategoryId: 4 },

  // 신선식 (parentCategoryId: 5) - 6개
  { id: 501, name: '과일', parentCategoryId: 5 },
  { id: 502, name: '샐러드', parentCategoryId: 5 },
  { id: 503, name: '빵', parentCategoryId: 5 },
  { id: 504, name: '샌드위치', parentCategoryId: 5 },
  { id: 505, name: '요거트류', parentCategoryId: 5 },
  { id: 506, name: '유제품', parentCategoryId: 5 },

  // 원두커피 (parentCategoryId: 6) - 3개
  { id: 601, name: '드립커피', parentCategoryId: 6 },
  { id: 602, name: '원두', parentCategoryId: 6 },
  { id: 603, name: '캡슐커피', parentCategoryId: 6 },

  // 비품 (parentCategoryId: 7) - 4개
  { id: 701, name: '일회용품', parentCategoryId: 7 },
  { id: 702, name: '사무용품', parentCategoryId: 7 },
  { id: 703, name: '청소용품', parentCategoryId: 7 },
  { id: 704, name: '위생용품', parentCategoryId: 7 },
];

// 상품 데이터 (categoryId는 하위 카테고리 ID를 직접 사용)
const products = [
  // 스낵 - 과자(101), 쿠키(102), 비스켓류(103), 초콜릿류(104), 캔디류(105), 젤리류(106), 시리얼바(107), 견과류(108)
  {
    name: '농심 새우깡',
    price: 1800,
    link: 'https://example.com/products/1001',
    image: '01_농심_새우깡.png',
    categoryId: 101,
  },
  {
    name: '해태 홈런볼',
    price: 2000,
    link: 'https://example.com/products/1002',
    image: '02_해태_홈런볼.png',
    categoryId: 101,
  },
  {
    name: '오리온 포카칩',
    price: 2200,
    link: 'https://example.com/products/1003',
    image: '03_오리온_포카칩.png',
    categoryId: 101,
  },
  {
    name: '오리온 고래밥',
    price: 1800,
    link: 'https://example.com/products/1004',
    image: '04_오리온_고래밥.png',
    categoryId: 101,
  },
  {
    name: '오리온 오감자',
    price: 2000,
    link: 'https://example.com/products/1005',
    image: '05_오리온_오감자.png',
    categoryId: 101,
  },
  {
    name: '롯데 마가렛트',
    price: 3500,
    link: 'https://example.com/products/1006',
    image: '06_롯데_마가렛트.png',
    categoryId: 102,
  },
  {
    name: '롯데 칸쵸',
    price: 1500,
    link: 'https://example.com/products/1007',
    image: '07_롯데_칸쵸.png',
    categoryId: 102,
  },
  {
    name: '크라운 산도',
    price: 1700,
    link: 'https://example.com/products/1008',
    image: '08_크라운_산도.png',
    categoryId: 102,
  },
  {
    name: '크라운 뽀또',
    price: 1700,
    link: 'https://example.com/products/1009',
    image: '09_크라운_뽀또.png',
    categoryId: 103,
  },
  {
    name: '오리온 초코파이',
    price: 4000,
    link: 'https://example.com/products/1010',
    image: '10_오리온_초코파이.png',
    categoryId: 103,
  },
  {
    name: '해태 후렌치파이',
    price: 2000,
    link: 'https://example.com/products/1011',
    image: '11_해태_후렌치파이.png',
    categoryId: 103,
  },
  {
    name: '페레로로쉐',
    price: 3500,
    link: 'https://example.com/products/1012',
    image: '12_페레로로쉐.png',
    categoryId: 104,
  },
  {
    name: '롯데 가나초콜릿',
    price: 2500,
    link: 'https://example.com/products/1013',
    image: '13_롯데_가나초콜릿.png',
    categoryId: 104,
  },
  {
    name: '롯데 목캔디',
    price: 1500,
    link: 'https://example.com/products/1014',
    image: '14_롯데_목캔디.png',
    categoryId: 105,
  },
  {
    name: '청우 젤리스트로베리',
    price: 1200,
    link: 'https://example.com/products/1015',
    image: '15_청우_젤리스트로베리.png',
    categoryId: 106,
  },
  {
    name: '오리온 닥터유 단백질바',
    price: 2500,
    link: 'https://example.com/products/1016',
    image: '16_오리온_닥터유_단백질바.png',
    categoryId: 107,
  },
  {
    name: '허니버터 아몬드',
    price: 3000,
    link: 'https://example.com/products/1017',
    image: '17_허니버터_아몬드.png',
    categoryId: 108,
  },

  // 음료 - 탄산음료(201), 과즙음료(202), 에너지음료(203), 이온음료(204), 건강음료(205), 차류(206)
  {
    name: '코카콜라 500ml',
    price: 2200,
    link: 'https://example.com/products/2001',
    image: '18_코카콜라_500ml.png',
    categoryId: 201,
  },
  {
    name: '펩시콜라 500ml',
    price: 2000,
    link: 'https://example.com/products/2002',
    image: '19_펩시콜라_500ml.png',
    categoryId: 201,
  },
  {
    name: '칠성사이다 500ml',
    price: 2000,
    link: 'https://example.com/products/2003',
    image: '20_칠성사이다_500ml.png',
    categoryId: 201,
  },
  {
    name: '트로피카나 스파클링',
    price: 1800,
    link: 'https://example.com/products/2004',
    image: '21_트로피카나_스파클링.png',
    categoryId: 201,
  },
  {
    name: '델몬트 오렌지주스',
    price: 2500,
    link: 'https://example.com/products/2005',
    image: '22_델몬트_오렌지주스.png',
    categoryId: 202,
  },
  {
    name: '썬키스트 포도주스',
    price: 2500,
    link: 'https://example.com/products/2006',
    image: '23_썬키스트_포도주스.png',
    categoryId: 202,
  },
  {
    name: '레드불',
    price: 3500,
    link: 'https://example.com/products/2007',
    image: '24_레드불.png',
    categoryId: 203,
  },
  {
    name: '핫식스',
    price: 2000,
    link: 'https://example.com/products/2008',
    image: '25_핫식스.png',
    categoryId: 203,
  },
  {
    name: '포카리스웨트',
    price: 1800,
    link: 'https://example.com/products/2009',
    image: '26_포카리스웨트.png',
    categoryId: 204,
  },
  {
    name: '게토레이',
    price: 1800,
    link: 'https://example.com/products/2010',
    image: '27_게토레이.png',
    categoryId: 204,
  },
  {
    name: '헛개수',
    price: 2000,
    link: 'https://example.com/products/2011',
    image: '28_헛개수.png',
    categoryId: 205,
  },
  {
    name: '비타500',
    price: 1200,
    link: 'https://example.com/products/2012',
    image: '29_비타500.png',
    categoryId: 205,
  },
  {
    name: '녹차 500ml',
    price: 1500,
    link: 'https://example.com/products/2013',
    image: '30_녹차_500ml.png',
    categoryId: 206,
  },
  {
    name: '보리차 500ml',
    price: 1500,
    link: 'https://example.com/products/2014',
    image: '31_보리차_500ml.png',
    categoryId: 206,
  },

  // 생수 - 생수(301), 스파클링(302)
  {
    name: '삼다수 500ml',
    price: 1200,
    link: 'https://example.com/products/3001',
    image: '32_삼다수_500ml.png',
    categoryId: 301,
  },
  {
    name: '아이시스 8.0 500ml',
    price: 1100,
    link: 'https://example.com/products/3002',
    image: '33_아이시스_8.0_500ml.png',
    categoryId: 301,
  },
  {
    name: '에비앙 500ml',
    price: 2500,
    link: 'https://example.com/products/3003',
    image: '34_에비앙_500ml.png',
    categoryId: 301,
  },
  {
    name: '백산수 500ml',
    price: 1200,
    link: 'https://example.com/products/3004',
    image: '35_백산수_500ml.png',
    categoryId: 301,
  },
  {
    name: '동원샘물 500ml',
    price: 1000,
    link: 'https://example.com/products/3005',
    image: '36_동원샘물_500ml.png',
    categoryId: 301,
  },
  {
    name: '트레비 레몬 500ml',
    price: 1700,
    link: 'https://example.com/products/3006',
    image: '37_트레비_레몬_500ml.png',
    categoryId: 302,
  },
  {
    name: '씨그램 플레인 500ml',
    price: 1600,
    link: 'https://example.com/products/3007',
    image: '38_씨그램_플레인_500ml.png',
    categoryId: 302,
  },

  // 간편식 - 컵라면(401), 소시지(402), 계란(403), 컵밥류(404), 시리얼(405)
  {
    name: '농심 신라면 컵',
    price: 1500,
    link: 'https://example.com/products/4001',
    image: '39_농심_신라면_컵.png',
    categoryId: 401,
  },
  {
    name: '오뚜기 진라면 컵',
    price: 1500,
    link: 'https://example.com/products/4002',
    image: '40_오뚜기_진라면_컵.png',
    categoryId: 401,
  },
  {
    name: '오뚜기 컵누들',
    price: 1200,
    link: 'https://example.com/products/4003',
    image: '41_오뚜기_컵누들.png',
    categoryId: 401,
  },
  {
    name: 'CJ 맥스봉 소시지',
    price: 2000,
    link: 'https://example.com/products/4004',
    image: '42_CJ_맥스봉_소시지.png',
    categoryId: 402,
  },
  {
    name: '롯데 의성마늘 비엔나',
    price: 2500,
    link: 'https://example.com/products/4005',
    image: '43_롯데_의성마늘_비엔나.png',
    categoryId: 402,
  },
  {
    name: '구운계란 2구',
    price: 1500,
    link: 'https://example.com/products/4006',
    image: '44_구운계란_2구.png',
    categoryId: 403,
  },
  {
    name: 'CJ 햇반 컵밥',
    price: 3500,
    link: 'https://example.com/products/4007',
    image: '45_CJ_햇반_컵밥.png',
    categoryId: 404,
  },
  {
    name: '오뚜기 컵밥 김치참치',
    price: 3000,
    link: 'https://example.com/products/4008',
    image: '46_오뚜기_컵밥_김치참치.png',
    categoryId: 404,
  },
  {
    name: '켈로그 콘푸로스트',
    price: 5000,
    link: 'https://example.com/products/4009',
    image: '47_켈로그_콘푸로스트.png',
    categoryId: 405,
  },

  // 신선식 - 과일(501), 샐러드(502), 빵(503), 샌드위치(504), 요거트류(505), 유제품(506)
  {
    name: '사과 1개',
    price: 2000,
    link: 'https://example.com/products/5001',
    image: '48_사과_1개.png',
    categoryId: 501,
  },
  {
    name: '바나나 1송이',
    price: 3000,
    link: 'https://example.com/products/5002',
    image: '49_바나나_1송이.png',
    categoryId: 501,
  },
  {
    name: '풀무원 샐러드',
    price: 4000,
    link: 'https://example.com/products/5003',
    image: '50_풀무원_샐러드.png',
    categoryId: 502,
  },
  {
    name: '파리바게뜨 소금빵',
    price: 2500,
    link: 'https://example.com/products/5004',
    image: '51_파리바게뜨_소금빵.png',
    categoryId: 503,
  },
  {
    name: '파리바게뜨 크림빵',
    price: 2500,
    link: 'https://example.com/products/5005',
    image: '52_파리바게뜨_크림빵.png',
    categoryId: 503,
  },
  {
    name: '파리바게뜨 햄치즈샌드위치',
    price: 3500,
    link: 'https://example.com/products/5006',
    image: '53_파리바게뜨_햄치즈샌드위치.png',
    categoryId: 504,
  },
  {
    name: 'CU 클럽샌드위치',
    price: 4000,
    link: 'https://example.com/products/5007',
    image: '54_CU_클럽샌드위치.png',
    categoryId: 504,
  },
  {
    name: '빙그레 요플레',
    price: 1500,
    link: 'https://example.com/products/5008',
    image: '55_빙그레_요플레.png',
    categoryId: 505,
  },
  {
    name: '풀무원 그릭요거트',
    price: 2500,
    link: 'https://example.com/products/5009',
    image: '56_풀무원_그릭요거트.png',
    categoryId: 505,
  },
  {
    name: '서울우유 흰우유 200ml',
    price: 1500,
    link: 'https://example.com/products/5010',
    image: '57_서울우유_흰우유_200ml.png',
    categoryId: 506,
  },
  {
    name: '서울우유 스트링치즈',
    price: 2000,
    link: 'https://example.com/products/5011',
    image: '58_서울우유_스트링치즈.png',
    categoryId: 506,
  },

  // 원두커피 - 드립커피(601), 원두(602), 캡슐커피(603)
  {
    name: '카누 미니 아메리카노',
    price: 15000,
    link: 'https://example.com/products/6001',
    image: '59_카누_미니_아메리카노.png',
    categoryId: 601,
  },
  {
    name: '스타벅스 드립백커피',
    price: 12000,
    link: 'https://example.com/products/6002',
    image: '60_스타벅스_드립백커피.png',
    categoryId: 601,
  },
  {
    name: '스타벅스 하우스블렌드 원두',
    price: 18000,
    link: 'https://example.com/products/6003',
    image: '61_스타벅스_하우스블렌드_원두.png',
    categoryId: 602,
  },
  {
    name: '일리 클래시코 원두',
    price: 20000,
    link: 'https://example.com/products/6004',
    image: '62_일리_클래시코_원두.png',
    categoryId: 602,
  },
  {
    name: '네스프레소 캡슐 10개입',
    price: 8000,
    link: 'https://example.com/products/6005',
    image: '63_네스프레소_캡슐_10개입.png',
    categoryId: 603,
  },
  {
    name: '돌체구스토 아메리카노',
    price: 7000,
    link: 'https://example.com/products/6006',
    image: '64_돌체구스토_아메리카노.png',
    categoryId: 603,
  },

  // 비품 - 일회용품(701), 사무용품(702), 청소용품(703), 위생용품(704)
  {
    name: '일회용 종이컵 100개',
    price: 3000,
    link: 'https://example.com/products/7001',
    image: '65_일회용_종이컵_100개.png',
    categoryId: 701,
  },
  {
    name: '일회용 나무젓가락 100개',
    price: 2000,
    link: 'https://example.com/products/7002',
    image: '66_일회용_나무젓가락_100개.png',
    categoryId: 701,
  },
  {
    name: '모나미 볼펜',
    price: 1000,
    link: 'https://example.com/products/7003',
    image: '67_모나미_볼펜.png',
    categoryId: 702,
  },
  {
    name: '3M 포스트잇',
    price: 2500,
    link: 'https://example.com/products/7004',
    image: '68_3M_포스트잇.png',
    categoryId: 702,
  },
  {
    name: 'A4용지 500매',
    price: 8000,
    link: 'https://example.com/products/7005',
    image: '69_A4용지_500매.png',
    categoryId: 702,
  },
  {
    name: '다이소 청소솔',
    price: 2000,
    link: 'https://example.com/products/7006',
    image: '70_다이소_청소솔.png',
    categoryId: 703,
  },
  {
    name: '물걸레 청소포',
    price: 5000,
    link: 'https://example.com/products/7007',
    image: '71_물걸레_청소포.png',
    categoryId: 703,
  },
  {
    name: '크리넥스 미용티슈',
    price: 3500,
    link: 'https://example.com/products/7008',
    image: '72_크리넥스_미용티슈.png',
    categoryId: 704,
  },
  {
    name: '손소독제 500ml',
    price: 5000,
    link: 'https://example.com/products/7009',
    image: '73_손소독제_500ml.png',
    categoryId: 704,
  },
];

// ============================================================================
// 시드 실행 함수
// ============================================================================

async function main() {
  console.log('🌱 시드 데이터 생성 시작...\n');

  // 1. 기존 데이터 삭제 (역순으로 삭제 - FK 제약조건 고려)
  console.log('🗑️  기존 데이터 삭제 중...');
  await prisma.purchaseItems.deleteMany();
  await prisma.purchaseRequests.deleteMany();
  await prisma.carts.deleteMany();
  await prisma.products.deleteMany();
  await prisma.categoies.deleteMany();
  await prisma.budgets.deleteMany();
  await prisma.budgetCriteria.deleteMany();
  await prisma.invitations.deleteMany();
  await prisma.users.deleteMany();
  await prisma.companies.deleteMany();
  console.log('✅ 기존 데이터 삭제 완료\n');

  // 2. 테스트용 회사 생성
  console.log('🏢 테스트 회사 생성 중...');
  const company = await prisma.companies.create({
    data: {
      name: '테스트 회사',
      businessNumber: '123-45-67890',
    },
  });
  console.log(`✅ 회사 생성 완료: ${company.name}\n`);

  // 3. 상위 카테고리 생성
  console.log('📁 상위 카테고리 생성 중...');
  await Promise.all(
    mainCategories.map((category) =>
      prisma.categoies.create({
        data: {
          id: category.id,
          name: category.name,
          parentCategoryId: null,
        },
      })
    )
  );
  console.log(`✅ 상위 카테고리 ${mainCategories.length}개 생성 완료\n`);

  // 4. 하위 카테고리 생성
  console.log('📂 하위 카테고리 생성 중...');
  await Promise.all(
    subCategories.map((subCategory) =>
      prisma.categoies.create({
        data: {
          id: subCategory.id,
          name: subCategory.name,
          parentCategoryId: subCategory.parentCategoryId,
        },
      })
    )
  );
  console.log(`✅ 하위 카테고리 ${subCategories.length}개 생성 완료\n`);

  // 5. 상품 생성
  console.log('📦 상품 생성 중...');
  await Promise.all(
    products.map((product) =>
      prisma.products.create({
        data: {
          companyId: company.id,
          categoryId: product.categoryId,
          name: product.name,
          price: product.price,
          image: product.image,
          link: product.link,
        },
      })
    )
  );
  console.log(`✅ 상품 ${products.length}개 생성 완료\n`);

  // 6. 테스트 사용자 생성
  console.log('👤 테스트 사용자 생성 중...');

  // 테스트용 비밀번호 (실제 운영 환경에서는 다른 비밀번호 사용)
  let textPassword = process.env.SEED_ADMIN_PASSWORD ?? 'testA';
  let hashedPassword = await argon2.hash(textPassword);
  console.log(`   관리자 비밀번호: ${textPassword}\n`);

  await prisma.users.create({
    data: {
      companyId: company.id,
      email: 'admin@test.com',
      password: hashedPassword,
      name: '관리자',
      role: 'ADMIN',
    },
  });

  textPassword = process.env.SEED_MANAGER_PASSWORD ?? 'testM';
  hashedPassword = await argon2.hash(textPassword);
  console.log(`   매니저 비밀번호: ${textPassword}\n`);

  await prisma.users.create({
    data: {
      companyId: company.id,
      email: 'manager@test.com',
      password: hashedPassword,
      name: '매니저',
      role: 'MANAGER',
    },
  });

  textPassword = process.env.SEED_USER_PASSWORD ?? 'testU';
  hashedPassword = await argon2.hash(textPassword);
  console.log(`   일반사용자 비밀번호: ${textPassword}\n`);

  await prisma.users.create({
    data: {
      companyId: company.id,
      email: 'user@test.com',
      password: hashedPassword,
      name: '일반사용자',
      role: 'USER',
    },
  });
  console.log(`✅ 사용자 3명 생성 완료 (ADMIN, MANAGER, USER)`);

  // 7. 예산 기준 설정
  console.log('💰 예산 기준 설정 중...');
  await prisma.budgetCriteria.create({
    data: {
      companyId: company.id,
      amount: 1000000, // 100만원
    },
  });
  console.log('✅ 예산 기준 설정 완료\n');

  // 8. 월별 예산 생성 (현재 연도)
  console.log('📅 월별 예산 생성 중...');
  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  await Promise.all(
    months.map((month) =>
      prisma.budgets.create({
        data: {
          companyId: company.id,
          year: currentYear,
          month,
          amount: 1000000,
        },
      })
    )
  );
  console.log(`✅ ${currentYear}년 월별 예산 12개 생성 완료\n`);

  console.log('🎉 시드 데이터 생성 완료!');
  console.log('==========================================');
  console.log(`📊 생성된 데이터 요약:`);
  console.log(`   - 회사: 1개`);
  console.log(`   - 상위 카테고리: ${mainCategories.length}개`);
  console.log(`   - 하위 카테고리: ${subCategories.length}개`);
  console.log(`   - 상품: ${products.length}개`);
  console.log(`   - 사용자: 3명 (ADMIN, MANAGER, USER)`);
  console.log(`   - 예산 기준: 1개`);
  console.log(`   - 월별 예산: 12개`);
  console.log('==========================================');
}

main()
  .catch((e) => {
    console.error('❌ 시드 실행 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
