# 커피턴

함께 커피를 마시는 사람들이 구매 순서를 공유하는 모바일 중심 웹앱입니다. 현재 순서의 사람이 사거나 다른 사람이 대신 사면, 실제 구매자만 대기열 맨 뒤로 이동합니다.

## 기능

- 로그인 없는 공유 방과 추측하기 어려운 방 주소
- 현재 구매자와 전체 대기열
- 멤버 추가·삭제 및 순서 변경
- 기본 구매 및 대타 구매 기록
- 최근 구매 내역과 마지막 기록 취소
- 방 이름, 멤버 이름, 현재 순서 수정
- 5초 주기 및 화면 복귀 시 자동 동기화
- 홈 화면에 설치 가능한 PWA
- 동시 변경을 막는 버전 충돌 검사

## 로컬 실행

```powershell
npm install
npm run dev
```

개발 모드에서 Supabase 환경변수가 없으면 메모리 저장소를 사용합니다. 이 모드는 한 서버에서 전체 흐름을 빠르게 확인하기 위한 것으로, 개발 서버를 다시 시작하면 생성한 방이 사라집니다.

## Supabase 연결

1. Supabase 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/migrations`의 SQL 파일을 번호 순서대로 실행합니다. Supabase CLI를 사용한다면 프로젝트를 연결한 뒤 `supabase db push`를 실행해도 됩니다.
3. `.env.example`을 참고해 프로젝트 루트에 `.env.local`을 만듭니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY`는 방별 Realtime Broadcast에만 사용합니다. `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용이므로 `NEXT_PUBLIC_` 접두사를 붙이거나 브라우저 코드에서 사용하면 안 됩니다. 테이블에는 RLS가 적용되어 있고 앱은 Next.js API를 통해서만 데이터에 접근합니다.

## 검증

```powershell
npm run typecheck
npm test
npm run lint
npm run build
```

## Vercel 배포

1. 저장소를 Vercel 프로젝트로 가져옵니다.
2. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`를 Production 환경변수로 등록합니다.
3. 기본 Next.js 설정으로 배포합니다.

프로덕션에서는 Supabase URL과 서비스 역할 키가 없으면 메모리 저장소로 대체하지 않고 `503` 오류를 반환합니다. 배포 전에 세 환경변수를 모두 등록해야 실시간 동기화까지 동작합니다.

## 주요 구조

- `src/app`: 화면, API, PWA 메타데이터
- `src/components`: 방 생성 및 공유 방 인터페이스
- `src/lib/server/store.ts`: Supabase/개발 메모리 저장소
- `src/lib/queue.ts`: 공평 대기열 규칙
- `supabase/migrations`: 원자적 구매·취소·수정 RPC와 스키마