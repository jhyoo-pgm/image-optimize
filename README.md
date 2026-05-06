# 이미지 최적화 데모

웹에서 이미지를 다룰 때 **포맷**(JPG / WebP / AVIF)과 **해상도**(1x / 2x / 3x)가
용량과 로딩 속도에 어떤 영향을 주는지 직접 보여주는 정적 페이지입니다.

## 데모 구성

1. **포맷 비교** — 같은 1600w 이미지를 JPG · WebP · AVIF로 비교
2. **해상도 비교** — 800px 폭 슬롯에 800w / 1600w / 2400w 이미지를 각각 넣어
   고DPI 디스플레이에서의 화질 차이 시연
3. **로딩 체감** — 9개 변형을 동시에 받아 다운로드 시간·전송 속도를 표시

## 로컬 실행

```bash
npm install              # sharp 설치 (이미지 재생성에만 필요)
npm run build:images     # original.jpg → 9개 변형 생성
npm run serve            # http://localhost:8080
```

`images/` 폴더의 결과물을 그대로 커밋하므로, 배포 시 빌드 단계는 필요 없습니다.

## GitHub Pages 배포

1. **public** 저장소를 새로 만들고 이 디렉터리를 push
   ```bash
   git init
   git add .
   git commit -m "init: image optimization demo"
   git branch -M main
   git remote add origin https://github.com/<USER>/<REPO>.git
   git push -u origin main
   ```
2. GitHub → 해당 저장소 → **Settings** → **Pages**
3. Source: **Deploy from a branch**, Branch: `main` / `/ (root)` 선택 → Save
4. 1~2분 후 `https://<USER>.github.io/<REPO>/` 에서 접속

> Private repo로 배포하려면 GitHub Pro/Team/Enterprise 플랜이 필요합니다.
> Free 플랜은 public repo만 가능합니다.

## 디렉터리 구조

```
image-optimize/
├── original.jpg              # 원본 (2400×1479, 530KB)
├── images/                   # 변환 결과 (커밋됨)
│   ├── 800w.{jpg,webp,avif}
│   ├── 1600w.{jpg,webp,avif}
│   ├── 2400w.{jpg,webp,avif}
│   └── manifest.json         # 파일별 byte size
├── scripts/
│   └── build-images.js       # sharp 기반 변환 스크립트
├── index.html
├── style.css
├── script.js
├── .nojekyll                 # GitHub Pages가 Jekyll 처리 건너뛰게
└── package.json
```

## 측정 결과 (참고)

JPG는 표준 libjpeg(quality 80), WebP는 quality 80, AVIF는 quality 50으로
인코딩한 결과입니다.

| 변형 | 용량 | 원본 대비 |
|---|---:|---:|
| original.jpg (2400w) | 530.0 KB | 100% |
| 2400w.jpg | 447.0 KB | 84% |
| 2400w.webp | 266.4 KB | 50% |
| 2400w.avif | **152.7 KB** | **29%** |
| 1600w.jpg | 178.4 KB | 34% |
| 1600w.webp | 125.3 KB | 24% |
| 800w.webp | 34.1 KB | 6% |

비슷한 시각 품질에서 WebP는 JPG 대비 약 **30~40% 작게**, AVIF는
**60~65% 작게** 나오는 경향이 있습니다. 표시 크기에 맞는 해상도와
결합하면 절감 폭은 더 커집니다.
