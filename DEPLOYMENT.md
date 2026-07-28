# راهنمای استقرار سامانه خدمات پس از فروش روی لینوکس

این سند مرحله‌به‌مرحله راه‌اندازی برنامه روی سرور لینوکس شماست تا از داخل شبکه شرکت
با آدرس `http://192.168.1.234:7000` و (با تنظیم دلخواه) از بیرون شرکت قابل دسترس باشد.

---

## ۰) نقش‌ها و دسترسی پیش‌فرض

| نقش | امکانات |
|-----|---------|
| مدیر کل (سوپریوزر) | همه کارها + تعریف کاربر + تنظیم لوگو |
| مدیر خدمات | تایید قطعه، داشبورد، گزارش‌گیری |
| کارشناس تعمیر | کارتابل تعمیر، درخواست قطعه، اتمام تعمیر |
| کارشناس پذیرش | پذیرش دستگاه، رسید، تحویل به مشتری |
| کارشناس حسابداری | سود/هزینه/تسویه، گزارش مالی |

**ورود پیش‌فرض سوپریوزر:**
- نام کاربری: `vahid.askari110`
- رمز عبور: `Arman@0142`

> این مقادیر از فایل `.env` خوانده می‌شوند و قابل تغییرند.

---

## ۱) پیش‌نیازها

روی سرور (مثلاً Ubuntu/Debian) نصب کنید:

```bash
# Node.js 20 یا بالاتر
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 15 یا بالاتر
sudo apt-get install -y postgresql postgresql-contrib

# ابزارهای کمکی
sudo apt-get install -y git build-essential
```

---

## ۲) ساخت دیتابیس با رمز مورد نظر شما

رمز دیتابیس شما: **`ArmanHamrah0142`**

```bash
sudo -u postgres psql <<'SQL'
CREATE USER hamrah WITH PASSWORD 'ArmanHamrah0142';
CREATE DATABASE hamrah_service OWNER hamrah;
GRANT ALL PRIVILEGES ON DATABASE hamrah_service TO hamrah;
SQL
```

---

## ۳) دریافت کد از گیت و نصب

```bash
cd /opt
sudo git clone <آدرس-گیت-شما> hamrah-service
sudo chown -R $USER:$USER hamrah-service
cd hamrah-service

# نصب وابستگی‌ها
npm install
```

> هرگاه بعداً کدی به گیت اضافه کردید، کافی است:
> ```bash
> git pull && npm install && npx drizzle-kit push --force && pm2 restart hamrah
> ```
> برنامه طوری ساخته شده که آپدیت از گیت فقط با همین چند دستور انجام شود.

---

## ۴) فایل `.env`

فایل `.env` را در ریشه پروژه بسازید:

```env
# اتصال به دیتابیس (با رمز شما)
DATABASE_URL=postgresql://hamrah:ArmanHamrah0142@127.0.0.1:5432/hamrah_service

# یک رشته تصادفی طولانی برای امنیت نشست (تغییر دهید!)
AUTH_SECRET=یک-رشته-تصادفی-بسیار-طولانی-اینجا

# سوپریوزر
SUPER_ADMIN_USERNAME=vahid.askari110
SUPER_ADMIN_PASSWORD=Arman@0142

# پورت اجرا (۷۰۰۰ طبق درخواست شما)
PORT=7000
HOST=0.0.0.0
```

ساخت کلید امنیتی تصادفی:
```bash
openssl rand -hex 32   # خروجی را در AUTH_SECRET بگذارید
```

---

## ۵) اعمال ساختار دیتابیس (جداول)

```bash
npx drizzle-kit push --force
```
این دستور همه‌ی جداول را می‌سازد و سوپریوزر را هنگام اولین ورود خودکار ایجاد می‌کند.

---

## ۶) بیلد و اجرای دائمی روی پورت ۷۰۰۰

اول بیلد:
```bash
npm run build
```

اجرا با **PM2** (توصیه‌شده، اجرای دائمی و خودکار بعد از ری‌استارت سرور):

```bash
sudo npm install -g pm2

# اجرا روی پورت ۷۰۰۰ و شنود روی همه آی‌پی‌ها (0.0.0.0)
PORT=7000 HOST=0.0.0.0 pm2 start "npm run start" --name hamrah
pm2 save
pm2 startup    # دستوری که چاپ می‌شود را با sudo اجرا کنید
```

---

## ۷) باز کردن پورت در فایروال

```bash
sudo ufw allow 7000/tcp
sudo ufw allow from 192.168.1.0/24 to any port 7000   # فقط شبکه داخلی
```

حالا در شبکه شرکت با آدرس زیر باز می‌شود:
### ✅ `http://192.168.1.234:7000`

---

## ۸) دسترسی از بیرون شرکت (اینترنت)

برای دسترسی امن از بیرون، یک **Reverse Proxy با Nginx** + دامنه/آی‌پی ثابت پیشنهاد می‌شود:

```nginx
server {
    listen 80;
    server_name services.yourcompany.com;   # یا آی‌پی عمومی شما

    location / {
        proxy_pass http://127.0.0.1:7000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

سپس با گواهی رایگان SSL:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d services.yourcompany.com
```
اکنون از بیرون شرکت با `https://services.yourcompany.com` باز می‌شود.

---

## ۹) قرار دادن لوگوی شرکت

برنامه آماده‌ی آپلود لوگوست؛ نیازی به تغییر کد نیست:

1. با سوپریوزر وارد شوید.
2. به منوی **تنظیمات** بروید.
3. لوگوی خود را (PNG/JPG/SVG تا ۶۰۰KB) آپلود کنید و ذخیره نمایید.

لوگو به‌صورت خودکار در **داشبورد** و **رسید چاپی مشتری** ظاهر می‌شود.
> اگر تصویر لوگو را برای من بفرستید، می‌توانم آن را به‌صورت پیش‌فرض هم در پروژه قرار دهم.

---

## ۱۰) پشتیبان‌گیری روزانه (بکاپ)

```bash
# بکاپ کامل دیتابیس
pg_dump -U hamrah -h 127.0.0.1 hamrah_service | gzip > /backup/hamrah-$(date +%F).sql.gz
```
این دستور را در `crontab` بگذارید تا هر شب اجرا شود:
```bash
crontab -e
# اضافه کنید:
0 2 * * * pg_dump -U hamrah -h 127.0.0.1 hamrah_service | gzip > /backup/hamrah-$(date +\%F).sql.gz
```

---

## ۱۱) دستورهای مفید

| کار | دستور |
|-----|-------|
| مشاهده وضعیت | `pm2 status` |
| مشاهده لاگ | `pm2 logs hamrah` |
| ری‌استارت | `pm2 restart hamrah` |
| توقف | `pm2 stop hamrah` |
| اعمال تغییرات دیتابیس | `npx drizzle-kit push --force` |
| آپدیت از گیت | `git pull && npm install && npm run build && pm2 restart hamrah` |

---

## ۱۲) قابلیت‌هایی که برای فاز بعد پیشنهاد می‌شود

- پیامک (SMS) خودکار به مشتری هنگام آماده‌شدن دستگاه (اتصال به پنل پیامک).
- کد QR روی رسید برای پیگیری آنلاین وضعیت توسط مشتری.
- چند شعبه/انبار و مدیریت موجودی قطعات.
- زمان‌سنجی زمان تعمیر (SLA) و هشدار تأخیر.
- نقشه راهگزینی و گزارش PDF در کنار اکسل.
- احراز هویت دو مرحله‌ای (2FA) برای مدیران.
