/* eslint-disable */
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
  try {
    await prisma.purchaseItems.deleteMany();
    await prisma.purchaseRequests.deleteMany();
    await prisma.wishLists.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.products.deleteMany();
    await prisma.categoies.deleteMany();
    await prisma.budgets.deleteMany();
    await prisma.budgetCriteria.deleteMany();
    await prisma.invitations.deleteMany();
    await prisma.users.deleteMany();
    await prisma.companies.deleteMany();
  } catch (e) {
    if (e instanceof Error && e.message.includes('does not exist')) {
      console.log('⚠️  일부 테이블이 존재하지 않습니다. 계속 진행합니다.');
    } else {
      console.error('❌ 데이터 삭제 중 예상치 못한 오류 발생:', e);
      console.log('⚠️  오류를 무시하고 계속 진행합니다. 이후 작업 실패 시 오류를 확인하세요.');
    }
  }
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

  let textPassword = process.env.SEED_ADMIN_PASSWORD ?? 'testA1234!';
  let hashedPassword = await argon2.hash(textPassword);
  console.log(`   관리자 비밀번호: ${textPassword}`);

  const admin = await prisma.users.create({
    data: {
      companyId: company.id,
      email: 'admin@test.com',
      password: hashedPassword,
      name: '관리자',
      role: 'ADMIN',
    },
  });

  textPassword = process.env.SEED_MANAGER_PASSWORD ?? 'testM1234!';
  hashedPassword = await argon2.hash(textPassword);
  console.log(`   매니저 비밀번호: ${textPassword}`);

  const manager = await prisma.users.create({
    data: {
      companyId: company.id,
      email: 'manager@test.com',
      password: hashedPassword,
      name: '매니저',
      role: 'MANAGER',
    },
  });

  textPassword = process.env.SEED_USER_PASSWORD ?? 'testU1234!';
  hashedPassword = await argon2.hash(textPassword);
  console.log(`   일반사용자 비밀번호: ${textPassword}`);

  const user = await prisma.users.create({
    data: {
      companyId: company.id,
      email: 'user@test.com',
      password: hashedPassword,
      name: '일반사용자',
      role: 'USER',
    },
  });

  textPassword = process.env.SEED_USER2_PASSWORD ?? 'testU21234!';
  hashedPassword = await argon2.hash(textPassword);
  console.log(`   일반사용자2 비밀번호: ${textPassword}`);

  const user2 = await prisma.users.create({
    data: {
      companyId: company.id,
      email: 'user2@test.com',
      password: hashedPassword,
      name: '일반사용자2',
      role: 'USER',
    },
  });

  textPassword = '!Q2w3e4r';
  hashedPassword = await argon2.hash(textPassword);
  console.log(`   테스트 계정 비밀번호: ${textPassword}\n`);

  const testUser = await prisma.users.create({
    data: {
      companyId: company.id,
      email: 'test@test001.com',
      password: hashedPassword,
      name: '테스트사용자',
      role: 'USER',
    },
  });
  console.log(`✅ 사용자 5명 생성 완료 (ADMIN, MANAGER, USER, USER2, TEST)\n`);

  // 7. 예산 기준 설정
  console.log('💰 예산 기준 설정 중...');
  await prisma.budgetCriteria.create({
    data: {
      companyId: company.id,
      amount: 1000000,
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

  // 9. 상품 목록 조회
  console.log('📦 상품 목록 조회 중...');
  const allProducts = await prisma.products.findMany({
    orderBy: { id: 'asc' },
  });
  console.log(`✅ 상품 ${allProducts.length}개 조회 완료\n`);

  // 10. 구매 요청 생성 (총 30개)
  console.log('🛒 구매 요청 생성 중...');

  // 구매 요청 1: APPROVED - user가 요청, manager가 승인
  const purchaseRequest1 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user.id,
      approverId: manager.id,
      status: 'APPROVED',
      totalPrice: 15400,
      shippingFee: 3000,
      requestMessage: '회의용 간식 구매 요청드립니다.',
      createdAt: new Date('2024-11-01T10:00:00Z'),
      updatedAt: new Date('2024-11-01T14:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest1.id,
        productId: allProducts[0]!.id,
        quantity: 5,
        priceSnapshot: allProducts[0]!.price,
      },
      {
        purchaseRequestId: purchaseRequest1.id,
        productId: allProducts[17]!.id,
        quantity: 3,
        priceSnapshot: allProducts[17]!.price,
      },
    ],
  });

  // 구매 요청 2: PENDING - user가 요청
  const purchaseRequest2 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user.id,
      status: 'PENDING',
      totalPrice: 20000,
      shippingFee: 3000,
      requestMessage: '개인 간식 구매 요청합니다.',
      createdAt: new Date('2024-11-05T09:00:00Z'),
      updatedAt: new Date('2024-11-05T09:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest2.id,
        productId: allProducts[9]!.id,
        quantity: 2,
        priceSnapshot: allProducts[9]!.price,
      },
      {
        purchaseRequestId: purchaseRequest2.id,
        productId: allProducts[31]!.id,
        quantity: 10,
        priceSnapshot: allProducts[31]!.price,
      },
    ],
  });

  // 구매 요청 3: REJECTED - user가 요청, admin이 거절
  const purchaseRequest3 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user.id,
      approverId: admin.id,
      status: 'REJECTED',
      totalPrice: 43000,
      shippingFee: 3000,
      requestMessage: '고급 원두 구매 요청',
      rejectReason: '예산 초과로 인한 거절',
      createdAt: new Date('2024-11-03T11:00:00Z'),
      updatedAt: new Date('2024-11-03T16:00:00Z'),
    },
  });
  await prisma.purchaseItems.create({
    data: {
      purchaseRequestId: purchaseRequest3.id,
      productId: allProducts[62]!.id,
      quantity: 2,
      priceSnapshot: allProducts[62]!.price,
    },
  });

  // 구매 요청 4: APPROVED - manager가 요청, admin이 승인
  const purchaseRequest4 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: manager.id,
      approverId: admin.id,
      status: 'APPROVED',
      totalPrice: 23500,
      shippingFee: 3000,
      requestMessage: '사무용품 재고 보충',
      createdAt: new Date('2024-11-04T13:00:00Z'),
      updatedAt: new Date('2024-11-04T15:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest4.id,
        productId: allProducts[69]!.id,
        quantity: 2,
        priceSnapshot: allProducts[69]!.price,
      },
      {
        purchaseRequestId: purchaseRequest4.id,
        productId: allProducts[68]!.id,
        quantity: 3,
        priceSnapshot: allProducts[68]!.price,
      },
    ],
  });

  // 구매 요청 5: CANCELLED - user가 요청 후 취소
  const purchaseRequest5 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user.id,
      status: 'CANCELLED',
      totalPrice: 18000,
      shippingFee: 3000,
      requestMessage: '커피 구매 (취소함)',
      createdAt: new Date('2024-11-02T08:00:00Z'),
      updatedAt: new Date('2024-11-02T09:00:00Z'),
    },
  });
  await prisma.purchaseItems.create({
    data: {
      purchaseRequestId: purchaseRequest5.id,
      productId: allProducts[59]!.id,
      quantity: 1,
      priceSnapshot: allProducts[59]!.price,
    },
  });

  // 구매 요청 6: APPROVED - user2가 요청, manager가 승인
  const purchaseRequest6 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user2.id,
      approverId: manager.id,
      status: 'APPROVED',
      totalPrice: 19000,
      shippingFee: 3000,
      requestMessage: '팀 음료 구매 요청드립니다.',
      createdAt: new Date('2024-11-06T10:00:00Z'),
      updatedAt: new Date('2024-11-06T14:30:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest6.id,
        productId: allProducts[18]!.id,
        quantity: 5,
        priceSnapshot: allProducts[18]!.price,
      },
      {
        purchaseRequestId: purchaseRequest6.id,
        productId: allProducts[25]!.id,
        quantity: 5,
        priceSnapshot: allProducts[25]!.price,
      },
    ],
  });

  // 구매 요청 7: PENDING - user2가 요청
  const purchaseRequest7 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user2.id,
      status: 'PENDING',
      totalPrice: 13800,
      shippingFee: 3000,
      requestMessage: '간식 구매 부탁드립니다.',
      createdAt: new Date('2024-11-07T11:00:00Z'),
      updatedAt: new Date('2024-11-07T11:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest7.id,
        productId: allProducts[16]!.id,
        quantity: 3,
        priceSnapshot: allProducts[16]!.price,
      },
      {
        purchaseRequestId: purchaseRequest7.id,
        productId: allProducts[28]!.id,
        quantity: 4,
        priceSnapshot: allProducts[28]!.price,
      },
    ],
  });

  // 구매 요청 8: APPROVED - testUser가 요청, manager가 승인
  const purchaseRequest8 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: testUser.id,
      approverId: manager.id,
      status: 'APPROVED',
      totalPrice: 15000,
      shippingFee: 3000,
      requestMessage: '업무용 커피 구매 요청',
      createdAt: new Date('2024-11-08T14:00:00Z'),
      updatedAt: new Date('2024-11-08T16:00:00Z'),
    },
  });
  await prisma.purchaseItems.create({
    data: {
      purchaseRequestId: purchaseRequest8.id,
      productId: allProducts[60]!.id,
      quantity: 1,
      priceSnapshot: allProducts[60]!.price,
    },
  });

  // 구매 요청 9: REJECTED - testUser가 요청, admin이 거절
  const purchaseRequest9 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: testUser.id,
      approverId: admin.id,
      status: 'REJECTED',
      totalPrice: 26500,
      shippingFee: 3000,
      requestMessage: '간식 대량 구매 요청',
      rejectReason: '예산 부족으로 반려합니다.',
      createdAt: new Date('2024-11-09T11:00:00Z'),
      updatedAt: new Date('2024-11-09T15:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest9.id,
        productId: allProducts[11]!.id,
        quantity: 5,
        priceSnapshot: allProducts[11]!.price,
      },
      {
        purchaseRequestId: purchaseRequest9.id,
        productId: allProducts[16]!.id,
        quantity: 3,
        priceSnapshot: allProducts[16]!.price,
      },
    ],
  });

  // 구매 요청 10: PENDING - testUser가 요청
  const purchaseRequest10 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: testUser.id,
      status: 'PENDING',
      totalPrice: 16600,
      shippingFee: 3000,
      requestMessage: '간식 및 음료 구매 요청합니다.',
      createdAt: new Date('2024-11-10T09:00:00Z'),
      updatedAt: new Date('2024-11-10T09:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest10.id,
        productId: allProducts[2]!.id,
        quantity: 3,
        priceSnapshot: allProducts[2]!.price,
      },
      {
        purchaseRequestId: purchaseRequest10.id,
        productId: allProducts[31]!.id,
        quantity: 5,
        priceSnapshot: allProducts[31]!.price,
      },
    ],
  });

  // 구매 요청 11: APPROVED - user가 요청, admin이 승인
  const purchaseRequest11 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user.id,
      approverId: admin.id,
      status: 'APPROVED',
      totalPrice: 14400,
      shippingFee: 3000,
      requestMessage: '팀 회의용 음료 구매',
      createdAt: new Date('2024-11-11T10:30:00Z'),
      updatedAt: new Date('2024-11-11T15:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest11.id,
        productId: allProducts[23]!.id,
        quantity: 4,
        priceSnapshot: allProducts[23]!.price,
      },
      {
        purchaseRequestId: purchaseRequest11.id,
        productId: allProducts[26]!.id,
        quantity: 2,
        priceSnapshot: allProducts[26]!.price,
      },
    ],
  });

  // 구매 요청 12: APPROVED - manager가 요청, admin이 승인
  const purchaseRequest12 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: manager.id,
      approverId: admin.id,
      status: 'APPROVED',
      totalPrice: 21000,
      shippingFee: 3000,
      requestMessage: '청소용품 구매',
      createdAt: new Date('2024-11-12T08:00:00Z'),
      updatedAt: new Date('2024-11-12T11:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest12.id,
        productId: allProducts[70]!.id,
        quantity: 2,
        priceSnapshot: allProducts[70]!.price,
      },
      {
        purchaseRequestId: purchaseRequest12.id,
        productId: allProducts[71]!.id,
        quantity: 3,
        priceSnapshot: allProducts[71]!.price,
      },
    ],
  });

  // 구매 요청 13: REJECTED - user2가 요청, manager가 거절
  const purchaseRequest13 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user2.id,
      approverId: manager.id,
      status: 'REJECTED',
      totalPrice: 32000,
      shippingFee: 3000,
      requestMessage: '고급 원두 여러 개 구매',
      rejectReason: '불필요한 구매로 판단됩니다.',
      createdAt: new Date('2024-11-13T09:00:00Z'),
      updatedAt: new Date('2024-11-13T14:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest13.id,
        productId: allProducts[61]!.id,
        quantity: 1,
        priceSnapshot: allProducts[61]!.price,
      },
      {
        purchaseRequestId: purchaseRequest13.id,
        productId: allProducts[63]!.id,
        quantity: 2,
        priceSnapshot: allProducts[63]!.price,
      },
    ],
  });

  // 구매 요청 14: CANCELLED - testUser가 취소
  const purchaseRequest14 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: testUser.id,
      status: 'CANCELLED',
      totalPrice: 12000,
      shippingFee: 3000,
      requestMessage: '라면 구매 (취소함)',
      createdAt: new Date('2024-11-14T10:00:00Z'),
      updatedAt: new Date('2024-11-14T10:30:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest14.id,
        productId: allProducts[38]!.id,
        quantity: 3,
        priceSnapshot: allProducts[38]!.price,
      },
      {
        purchaseRequestId: purchaseRequest14.id,
        productId: allProducts[39]!.id,
        quantity: 3,
        priceSnapshot: allProducts[39]!.price,
      },
    ],
  });

  // 구매 요청 15: PENDING - user가 요청
  const purchaseRequest15 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user.id,
      status: 'PENDING',
      totalPrice: 17000,
      shippingFee: 3000,
      requestMessage: '신선식품 구매',
      createdAt: new Date('2024-11-15T11:00:00Z'),
      updatedAt: new Date('2024-11-15T11:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest15.id,
        productId: allProducts[47]!.id,
        quantity: 3,
        priceSnapshot: allProducts[47]!.price,
      },
      {
        purchaseRequestId: purchaseRequest15.id,
        productId: allProducts[48]!.id,
        quantity: 2,
        priceSnapshot: allProducts[48]!.price,
      },
      {
        purchaseRequestId: purchaseRequest15.id,
        productId: allProducts[55]!.id,
        quantity: 2,
        priceSnapshot: allProducts[55]!.price,
      },
    ],
  });

  // 구매 요청 16: APPROVED - user2가 요청, manager가 승인
  const purchaseRequest16 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user2.id,
      approverId: manager.id,
      status: 'APPROVED',
      totalPrice: 18500,
      shippingFee: 3000,
      requestMessage: '간편식 구매',
      createdAt: new Date('2024-11-16T09:30:00Z'),
      updatedAt: new Date('2024-11-16T13:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest16.id,
        productId: allProducts[44]!.id,
        quantity: 2,
        priceSnapshot: allProducts[44]!.price,
      },
      {
        purchaseRequestId: purchaseRequest16.id,
        productId: allProducts[45]!.id,
        quantity: 3,
        priceSnapshot: allProducts[45]!.price,
      },
    ],
  });

  // 구매 요청 17: APPROVED - testUser가 요청, admin이 승인
  const purchaseRequest17 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: testUser.id,
      approverId: admin.id,
      status: 'APPROVED',
      totalPrice: 13000,
      shippingFee: 0,
      requestMessage: '생수 대량 구매',
      createdAt: new Date('2024-11-17T08:00:00Z'),
      updatedAt: new Date('2024-11-17T10:00:00Z'),
    },
  });
  await prisma.purchaseItems.create({
    data: {
      purchaseRequestId: purchaseRequest17.id,
      productId: allProducts[31]!.id,
      quantity: 10,
      priceSnapshot: allProducts[31]!.price,
    },
  });

  // 구매 요청 18: REJECTED - user가 요청, manager가 거절
  const purchaseRequest18 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user.id,
      approverId: manager.id,
      status: 'REJECTED',
      totalPrice: 27000,
      shippingFee: 3000,
      requestMessage: '에너지음료 여러 종류 구매',
      rejectReason: '유사 상품이 이미 있습니다.',
      createdAt: new Date('2024-11-18T10:00:00Z'),
      updatedAt: new Date('2024-11-18T14:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest18.id,
        productId: allProducts[23]!.id,
        quantity: 5,
        priceSnapshot: allProducts[23]!.price,
      },
      {
        purchaseRequestId: purchaseRequest18.id,
        productId: allProducts[24]!.id,
        quantity: 4,
        priceSnapshot: allProducts[24]!.price,
      },
    ],
  });

  // 구매 요청 19: PENDING - manager가 요청
  const purchaseRequest19 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: manager.id,
      status: 'PENDING',
      totalPrice: 19000,
      shippingFee: 3000,
      requestMessage: '사무용품 추가 구매',
      createdAt: new Date('2024-11-19T11:00:00Z'),
      updatedAt: new Date('2024-11-19T11:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest19.id,
        productId: allProducts[67]!.id,
        quantity: 10,
        priceSnapshot: allProducts[67]!.price,
      },
      {
        purchaseRequestId: purchaseRequest19.id,
        productId: allProducts[68]!.id,
        quantity: 3,
        priceSnapshot: allProducts[68]!.price,
      },
    ],
  });

  // 구매 요청 20: CANCELLED - user2가 취소
  const purchaseRequest20 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user2.id,
      status: 'CANCELLED',
      totalPrice: 15000,
      shippingFee: 3000,
      requestMessage: '초콜릿 구매 (취소함)',
      createdAt: new Date('2024-11-20T09:00:00Z'),
      updatedAt: new Date('2024-11-20T09:30:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest20.id,
        productId: allProducts[11]!.id,
        quantity: 3,
        priceSnapshot: allProducts[11]!.price,
      },
      {
        purchaseRequestId: purchaseRequest20.id,
        productId: allProducts[12]!.id,
        quantity: 2,
        priceSnapshot: allProducts[12]!.price,
      },
    ],
  });

  // 구매 요청 21: APPROVED - user가 요청, manager가 승인
  const purchaseRequest21 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user.id,
      approverId: manager.id,
      status: 'APPROVED',
      totalPrice: 11000,
      shippingFee: 0,
      requestMessage: '위생용품 구매',
      createdAt: new Date('2024-11-21T10:00:00Z'),
      updatedAt: new Date('2024-11-21T14:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest21.id,
        productId: allProducts[71]!.id,
        quantity: 1,
        priceSnapshot: allProducts[71]!.price,
      },
      {
        purchaseRequestId: purchaseRequest21.id,
        productId: allProducts[72]!.id,
        quantity: 2,
        priceSnapshot: allProducts[72]!.price,
      },
    ],
  });

  // 구매 요청 22: PENDING - testUser가 요청
  const purchaseRequest22 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: testUser.id,
      status: 'PENDING',
      totalPrice: 16500,
      shippingFee: 3000,
      requestMessage: '샌드위치와 샐러드 구매',
      createdAt: new Date('2024-11-22T08:30:00Z'),
      updatedAt: new Date('2024-11-22T08:30:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest22.id,
        productId: allProducts[52]!.id,
        quantity: 2,
        priceSnapshot: allProducts[52]!.price,
      },
      {
        purchaseRequestId: purchaseRequest22.id,
        productId: allProducts[49]!.id,
        quantity: 2,
        priceSnapshot: allProducts[49]!.price,
      },
    ],
  });

  // 구매 요청 23: APPROVED - user2가 요청, admin이 승인
  const purchaseRequest23 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user2.id,
      approverId: admin.id,
      status: 'APPROVED',
      totalPrice: 17000,
      shippingFee: 3000,
      requestMessage: '캡슐커피 구매',
      createdAt: new Date('2024-11-23T09:00:00Z'),
      updatedAt: new Date('2024-11-23T12:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest23.id,
        productId: allProducts[63]!.id,
        quantity: 1,
        priceSnapshot: allProducts[63]!.price,
      },
      {
        purchaseRequestId: purchaseRequest23.id,
        productId: allProducts[64]!.id,
        quantity: 1,
        priceSnapshot: allProducts[64]!.price,
      },
    ],
  });

  // 구매 요청 24: REJECTED - manager가 요청, admin이 거절
  const purchaseRequest24 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: manager.id,
      approverId: admin.id,
      status: 'REJECTED',
      totalPrice: 35000,
      shippingFee: 3000,
      requestMessage: '고급 원두 대량 구매',
      rejectReason: '다음 달에 재요청 바랍니다.',
      createdAt: new Date('2024-11-24T10:00:00Z'),
      updatedAt: new Date('2024-11-24T15:00:00Z'),
    },
  });
  await prisma.purchaseItems.create({
    data: {
      purchaseRequestId: purchaseRequest24.id,
      productId: allProducts[62]!.id,
      quantity: 1,
      priceSnapshot: allProducts[62]!.price,
    },
  });

  // 구매 요청 25: CANCELLED - testUser가 취소
  const purchaseRequest25 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: testUser.id,
      status: 'CANCELLED',
      totalPrice: 13600,
      shippingFee: 3000,
      requestMessage: '과자류 구매 (취소함)',
      createdAt: new Date('2024-11-25T11:00:00Z'),
      updatedAt: new Date('2024-11-25T11:30:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest25.id,
        productId: allProducts[1]!.id,
        quantity: 3,
        priceSnapshot: allProducts[1]!.price,
      },
      {
        purchaseRequestId: purchaseRequest25.id,
        productId: allProducts[2]!.id,
        quantity: 2,
        priceSnapshot: allProducts[2]!.price,
      },
    ],
  });

  // 구매 요청 26: APPROVED - user가 요청, admin이 승인
  const purchaseRequest26 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user.id,
      approverId: admin.id,
      status: 'APPROVED',
      totalPrice: 14500,
      shippingFee: 3000,
      requestMessage: '일회용품 구매',
      createdAt: new Date('2024-11-26T09:00:00Z'),
      updatedAt: new Date('2024-11-26T13:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest26.id,
        productId: allProducts[65]!.id,
        quantity: 2,
        priceSnapshot: allProducts[65]!.price,
      },
      {
        purchaseRequestId: purchaseRequest26.id,
        productId: allProducts[66]!.id,
        quantity: 4,
        priceSnapshot: allProducts[66]!.price,
      },
    ],
  });

  // 구매 요청 27: PENDING - user2가 요청
  const purchaseRequest27 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user2.id,
      status: 'PENDING',
      totalPrice: 12000,
      shippingFee: 3000,
      requestMessage: '요거트 구매',
      createdAt: new Date('2024-11-27T10:00:00Z'),
      updatedAt: new Date('2024-11-27T10:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest27.id,
        productId: allProducts[54]!.id,
        quantity: 3,
        priceSnapshot: allProducts[54]!.price,
      },
      {
        purchaseRequestId: purchaseRequest27.id,
        productId: allProducts[55]!.id,
        quantity: 3,
        priceSnapshot: allProducts[55]!.price,
      },
    ],
  });

  // 구매 요청 28: APPROVED - manager가 요청, admin이 승인
  const purchaseRequest28 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: manager.id,
      approverId: admin.id,
      status: 'APPROVED',
      totalPrice: 18000,
      shippingFee: 0,
      requestMessage: '차류 구매',
      createdAt: new Date('2024-11-28T08:00:00Z'),
      updatedAt: new Date('2024-11-28T11:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest28.id,
        productId: allProducts[29]!.id,
        quantity: 6,
        priceSnapshot: allProducts[29]!.price,
      },
      {
        purchaseRequestId: purchaseRequest28.id,
        productId: allProducts[30]!.id,
        quantity: 6,
        priceSnapshot: allProducts[30]!.price,
      },
    ],
  });

  // 구매 요청 29: REJECTED - testUser가 요청, manager가 거절
  const purchaseRequest29 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: testUser.id,
      approverId: manager.id,
      status: 'REJECTED',
      totalPrice: 22000,
      shippingFee: 3000,
      requestMessage: '스파클링 워터 대량 구매',
      rejectReason: '예산 초과로 인한 거절',
      createdAt: new Date('2024-11-29T09:00:00Z'),
      updatedAt: new Date('2024-11-29T14:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest29.id,
        productId: allProducts[36]!.id,
        quantity: 8,
        priceSnapshot: allProducts[36]!.price,
      },
      {
        purchaseRequestId: purchaseRequest29.id,
        productId: allProducts[37]!.id,
        quantity: 4,
        priceSnapshot: allProducts[37]!.price,
      },
    ],
  });

  // 구매 요청 30: PENDING - user가 요청
  const purchaseRequest30 = await prisma.purchaseRequests.create({
    data: {
      companyId: company.id,
      requesterId: user.id,
      status: 'PENDING',
      totalPrice: 20000,
      shippingFee: 3000,
      requestMessage: '시리얼과 우유 구매',
      createdAt: new Date('2024-11-30T10:00:00Z'),
      updatedAt: new Date('2024-11-30T10:00:00Z'),
    },
  });
  await prisma.purchaseItems.createMany({
    data: [
      {
        purchaseRequestId: purchaseRequest30.id,
        productId: allProducts[46]!.id,
        quantity: 2,
        priceSnapshot: allProducts[46]!.price,
      },
      {
        purchaseRequestId: purchaseRequest30.id,
        productId: allProducts[56]!.id,
        quantity: 5,
        priceSnapshot: allProducts[56]!.price,
      },
      {
        purchaseRequestId: purchaseRequest30.id,
        productId: allProducts[57]!.id,
        quantity: 3,
        priceSnapshot: allProducts[57]!.price,
      },
    ],
  });

  console.log(`✅ 구매 요청 30개 생성 완료\n`);

  // 11. 장바구니 데이터 생성
  console.log('🛍️  장바구니 데이터 생성 중...');

  // 일반 사용자의 장바구니
  await prisma.carts.createMany({
    data: [
      { userId: user.id, productId: allProducts[1]!.id, quantity: 3 },
      { userId: user.id, productId: allProducts[18]!.id, quantity: 5 },
      { userId: user.id, productId: allProducts[38]!.id, quantity: 2 },
      { userId: user.id, productId: allProducts[31]!.id, quantity: 8 },
      { userId: user.id, productId: allProducts[47]!.id, quantity: 2 },
    ],
  });

  // 매니저의 장바구니
  await prisma.carts.createMany({
    data: [
      { userId: manager.id, productId: allProducts[67]!.id, quantity: 10 },
      { userId: manager.id, productId: allProducts[71]!.id, quantity: 5 },
      { userId: manager.id, productId: allProducts[68]!.id, quantity: 4 },
      { userId: manager.id, productId: allProducts[69]!.id, quantity: 1 },
    ],
  });

  // 일반 사용자2의 장바구니
  await prisma.carts.createMany({
    data: [
      { userId: user2.id, productId: allProducts[5]!.id, quantity: 2 },
      { userId: user2.id, productId: allProducts[17]!.id, quantity: 6 },
      { userId: user2.id, productId: allProducts[52]!.id, quantity: 3 },
      { userId: user2.id, productId: allProducts[54]!.id, quantity: 4 },
    ],
  });

  // 테스트 사용자의 장바구니
  await prisma.carts.createMany({
    data: [
      { userId: testUser.id, productId: allProducts[2]!.id, quantity: 4 },
      { userId: testUser.id, productId: allProducts[19]!.id, quantity: 6 },
      { userId: testUser.id, productId: allProducts[32]!.id, quantity: 10 },
      { userId: testUser.id, productId: allProducts[39]!.id, quantity: 3 },
      { userId: testUser.id, productId: allProducts[60]!.id, quantity: 1 },
    ],
  });

  console.log(`✅ 장바구니 항목 18개 생성 완료\n`);

  // 12. 찜 목록 데이터 생성
  console.log('❤️  찜 목록 데이터 생성 중...');

  // 일반 사용자의 찜 목록
  await prisma.wishLists.createMany({
    data: [
      { userId: user.id, productId: allProducts[0]!.id },
      { userId: user.id, productId: allProducts[17]!.id },
      { userId: user.id, productId: allProducts[38]!.id },
      { userId: user.id, productId: allProducts[59]!.id },
      { userId: user.id, productId: allProducts[31]!.id },
      { userId: user.id, productId: allProducts[47]!.id },
      { userId: user.id, productId: allProducts[54]!.id },
    ],
  });

  // 일반 사용자2의 찜 목록
  await prisma.wishLists.createMany({
    data: [
      { userId: user2.id, productId: allProducts[5]!.id },
      { userId: user2.id, productId: allProducts[11]!.id },
      { userId: user2.id, productId: allProducts[47]!.id },
      { userId: user2.id, productId: allProducts[52]!.id },
      { userId: user2.id, productId: allProducts[63]!.id },
      { userId: user2.id, productId: allProducts[55]!.id },
    ],
  });

  // 매니저의 찜 목록
  await prisma.wishLists.createMany({
    data: [
      { userId: manager.id, productId: allProducts[67]!.id },
      { userId: manager.id, productId: allProducts[68]!.id },
      { userId: manager.id, productId: allProducts[71]!.id },
      { userId: manager.id, productId: allProducts[69]!.id },
      { userId: manager.id, productId: allProducts[70]!.id },
    ],
  });

  // 테스트 사용자의 찜 목록
  await prisma.wishLists.createMany({
    data: [
      { userId: testUser.id, productId: allProducts[1]!.id },
      { userId: testUser.id, productId: allProducts[18]!.id },
      { userId: testUser.id, productId: allProducts[31]!.id },
      { userId: testUser.id, productId: allProducts[48]!.id },
      { userId: testUser.id, productId: allProducts[60]!.id },
      { userId: testUser.id, productId: allProducts[16]!.id },
      { userId: testUser.id, productId: allProducts[39]!.id },
      { userId: testUser.id, productId: allProducts[63]!.id },
    ],
  });

  console.log(`✅ 찜 목록 26개 생성 완료\n`);

  console.log('🎉 시드 데이터 생성 완료!');
  console.log('==========================================');
  console.log(`📊 생성된 데이터 요약:`);
  console.log('');
  console.log('📌 데이터:');
  console.log(`   - 회사: 1개`);
  console.log(`   - 상위 카테고리: ${mainCategories.length}개`);
  console.log(`   - 하위 카테고리: ${subCategories.length}개`);
  console.log(`   - 상품: ${products.length}개`);
  console.log(`   - 사용자: 5명 (ADMIN, MANAGER, USER, USER2, TEST)`);
  console.log(`   - 예산 기준: 1개`);
  console.log(`   - 월별 예산: 12개 (${currentYear}년)`);
  console.log(`   - 구매 요청: 30개`);
  console.log(`   - 장바구니: 18개`);
  console.log(`   - 찜 목록: 26개`);
  console.log('==========================================');
  console.log('');
  console.log('👤 테스트 계정 정보:');
  console.log('   1. 관리자: admin@test.com / testA1234!');
  console.log('   2. 매니저: manager@test.com / testM1234!');
  console.log('   3. 일반사용자: user@test.com / testU1234!');
  console.log('   4. 일반사용자2: user2@test.com / testU21234!');
  console.log('   5. 테스트계정: test@test001.com / !Q2w3e4r');
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
