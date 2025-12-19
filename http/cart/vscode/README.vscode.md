# 🛒 Cart API - VSCode REST Client

VSCode에서 REST Client 확장 프로그램을 사용하여 Cart API를 테스트할 수 있습니다.

## 📋 사전 준비

1. **VSCode REST Client 확장 설치**
   - VSCode 마켓플레이스에서 "REST Client" 검색 후 설치
   - 또는: https://marketplace.visualstudio.com/items?itemName=humao.rest-client

2. **서버 실행**
   ```bash
   npm run dev
   ```

## 🚀 사용 방법

### 1단계: 로그인하여 토큰 받기

각 `.http` 파일의 최상단에 로그인 요청이 있습니다.

```http
POST http://localhost:4000/api/v1/auth/login
Content-Type: application/json

{
    "email": "user@test.com",
    "password": "testU"
}
```

**실행 방법:**

- 요청 블록 위에 표시되는 "Send Request" 클릭
- 또는 `Ctrl+Alt+R` (Windows/Linux) / `Cmd+Alt+R` (Mac)

### 2단계: 토큰 설정

로그인 응답에서 받은 `accessToken` 값을 복사하여:

**방법 1: 파일 내 변수 설정 (권장)**

```http
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**방법 2: http-client.env.json 파일 사용**

```json
{
  "dev": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3단계: API 요청 실행

토큰이 설정되면 다른 요청들을 실행할 수 있습니다.

## 📁 파일 목록

### Cart API

- `getMyCart.http` - 내 장바구니 조회 (페이지네이션 지원)
- `addToCart.http` - 장바구니에 상품 추가 (중복 상품 수량 증가 처리)
- `updateQuantity.http` - 장바구니 상품 수량 수정
- `deleteFromCart.http` - 장바구니에서 상품 삭제

## 🔧 API 엔드포인트

### 🛒 Cart (사용자)

#### GET /api/v1/cart/getMyCart

내 장바구니 목록 조회

**쿼리 파라미터:**

- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 10)

**예시:**

```http
# 기본 조회 (첫 페이지, 10개)
GET http://localhost:4000/api/v1/cart/getMyCart
Authorization: Bearer {{token}}

# 2페이지, 5개씩
GET http://localhost:4000/api/v1/cart/getMyCart?page=2&limit=5
Authorization: Bearer {{token}}
```

**응답 예시:**

```json
{
  "result": {
    "items": [
      {
        "id": "cart-item-id",
        "quantity": 2,
        "updatedAt": "2025-12-18T...",
        "product": {
          "id": 123,
          "name": "상품명",
          "price": 10000,
          "image": "https://...",
          "link": "https://...",
          "isActive": true,
          "createdAt": "2025-12-18T..."
        },
        "subtotal": 20000
      }
    ],
    "summary": {
      "totalItems": 15,
      "currentPageItemCount": 10,
      "currentPageTotalPrice": 150000,
      "totalPrice": 225000
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

#### POST /api/v1/cart/addToCart

장바구니에 상품 추가

**특징:**

- 새로운 상품을 장바구니에 추가
- 이미 있는 상품은 수량 증가 (중복 처리)
- 같은 회사의 상품만 추가 가능
- 비활성화된 상품은 추가 불가

**요청 바디:**

- `productId` (required): 상품 ID (정수)
- `quantity` (required): 수량 (1 이상의 정수)

**예시:**

```http
# 새 상품 추가
POST http://localhost:4000/api/v1/cart/addToCart
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "productId": 1,
  "quantity": 2
}

# 중복 상품 추가 (수량 증가)
POST http://localhost:4000/api/v1/cart/addToCart
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "productId": 1,
  "quantity": 3
}
```

**응답 예시 (새 상품):**

```json
{
  "message": "장바구니에 상품이 추가되었습니다.",
  "result": {
    "id": "cart-item-id",
    "quantity": 2,
    "updatedAt": "2025-12-18T...",
    "product": {
      "id": 1,
      "name": "상품명",
      "price": 10000,
      "image": "https://...",
      "link": "https://...",
      "isActive": true
    },
    "subtotal": 20000,
    "isNew": true
  }
}
```

**응답 예시 (중복 상품 수량 증가):**

```json
{
  "message": "장바구니 상품의 수량이 증가했습니다.",
  "result": {
    "id": "cart-item-id",
    "quantity": 5,
    "updatedAt": "2025-12-18T...",
    "product": {
      "id": 1,
      "name": "상품명",
      "price": 10000,
      "image": "https://...",
      "link": "https://...",
      "isActive": true
    },
    "subtotal": 50000,
    "isNew": false
  }
}
```

#### PATCH /api/v1/cart/updateQuantity

장바구니 상품 수량 수정

**특징:**

- 장바구니에 있는 상품의 수량을 변경
- 본인의 장바구니 항목만 수정 가능
- 수량은 1 이상이어야 함

**요청 바디:**

- `cartItemId` (required): 장바구니 항목 ID (UUID string)
- `quantity` (required): 변경할 수량 (1 이상의 정수)

**예시:**

```http
# 수량을 5로 변경
PATCH http://localhost:4000/api/v1/cart/updateQuantity
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "cartItemId": "abc12345",
  "quantity": 5
}
```

**응답 예시:**

```json
{
  "message": "장바구니 상품 수량이 수정되었습니다.",
  "result": {
    "id": "cart-item-id",
    "quantity": 5,
    "updatedAt": "2025-12-18T...",
    "product": {
      "id": 1,
      "name": "상품명",
      "price": 10000,
      "image": "https://...",
      "link": "https://...",
      "isActive": true
    },
    "subtotal": 50000
  }
}
```

**에러 응답:**

- 404: 장바구니 항목을 찾을 수 없음
- 400: 다른 사용자의 장바구니 항목 (권한 없음)
- 400: 유효하지 않은 수량 (1 미만)

#### DELETE /api/v1/cart/deleteFromCart

장바구니에서 상품 삭제

**특징:**

- 장바구니에서 특정 상품을 완전히 삭제
- 본인의 장바구니 항목만 삭제 가능
- 삭제된 항목의 정보를 응답으로 반환

**요청 바디:**

- `cartItemId` (required): 장바구니 항목 ID (UUID string)

**예시:**

```http
DELETE http://localhost:4000/api/v1/cart/deleteFromCart
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "cartItemId": "abc12345"
}
```

**응답 예시:**

```json
{
  "message": "장바구니에서 상품이 삭제되었습니다:",
  "returnData": {
    "id": "cart-item-id",
    "productId": 1,
    "quantity": 2,
    "updatedAt": "2025-12-18T..."
  }
}
```

**에러 응답:**

- 404: 장바구니 항목을 찾을 수 없음
- 400: 다른 사용자의 장바구니 항목 (권한 없음)

## 💡 팁

1. **환경 전환**: http-client.env.json에서 `dev`와 `prod` 환경을 쉽게 전환할 수 있습니다.

2. **응답 저장**: 요청 실행 후 응답을 파일로 저장할 수 있습니다.

3. **변수 사용**: `@변수명 = 값` 형식으로 변수를 정의하고 `{{변수명}}`으로 사용할 수 있습니다.

4. **요청 구분**: `###`로 요청을 구분합니다.

## ⚠️ 주의사항

- 토큰은 보안상 중요하므로 git에 커밋하지 마세요
- `.http` 파일은 커밋해도 되지만, 실제 토큰 값은 제거하고 커밋하세요
- `http-client.env.json` 파일은 `.gitignore`에 추가하는 것을 권장합니다

## 🔗 관련 문서

- [REST Client 확장 문서](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [API 명세서](../../README.md)
