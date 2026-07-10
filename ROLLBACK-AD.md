# Откат ветки A+D (webapp)

Ветка: **`feature/ad-ui-improvements`**

```powershell
cd G:\проги\webapp
git checkout main
git branch -D feature/ad-ui-improvements
npm run build
```

Затем redeploy на Vercel с ветки `main`.

См. также `G:\проги\ss\ROLLBACK-AD.md` для бэкенда.
