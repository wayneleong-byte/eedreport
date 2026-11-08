# eedreport (app)

澳門科學館 EED 主管會報告 — **Command Holodeck AMPED** 全棧（Express + Vite React + SQLite）。

- 靜態預覽（Pages）：https://wayneleong-byte.github.io/eedreport/ （`main`）
- 本分支 `app`：有編輯 API 的正式站源碼，供 Railway 部署

## Railway

1. 接此 repo，選分支 **`app`**；用 `Dockerfile`
2. Volume 掛 `/data`
3. 環境變數：
   - `DATABASE_PATH=/data/data.db`
   - `EED_EDIT_SECRET=<密鑰>`
   - `PORT` 由 Railway 注入
4. 首次啟動會用 `server/live-snapshot.json` seed（若 DB 空）

## 本機

```bash
npm ci
cp .env.example .env   # 填 EED_EDIT_SECRET
npm run dev            # 或 npm run build && npm start
```
