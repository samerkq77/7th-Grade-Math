# 7th-Grade-Math — رياضيات فهمان
Created for Salma

موقع عربي تفاعلي لطلاب **الصف السابع** يشرح دروس **الرياضيات حسب المنهاج الأردني** درسًا درسًا، بطريقة بسيطة ومضحكة، مع مئات المسائل التي تُصحَّح فورًا.

An Arabic, kid-friendly website that explains the Jordanian Grade 7 math curriculum lesson by lesson, with hundreds of self-checking practice problems.

## ماذا يوجد في الموقع؟

- **8 وحدات** (4 في كل فصل دراسي) مقسّمة إلى دروس.
- لكل درس: حكاية مضحكة، أهداف، شرح مبسّط مع "قاعدة ذهبية"، أمثلة محلولة خطوة بخطوة، حيلة للحفظ، ونكتة.
- **12 مسألة أو أكثر لكل درس** بثلاثة مستويات (سهل، متوسط، تحدٍّ)، مع تلميح وحل لكل مسألة.
- **آلة المسائل العجيبة**: تولّد مسائل جديدة عشوائيًّا بلا نهاية في دروس الحساب.
- **اختبار لكل وحدة** (10 أسئلة عشوائية) مع حفظ أفضل نتيجة.
- نقاط ونجوم تُحفظ في المتصفح، ووضع ليلي (سبّورة).

## Units

| الفصل الأول | الفصل الثاني |
|---|---|
| 1. الأعداد النسبية | 5. التناسب وتطبيقاته |
| 2. الأسس الصحيحة والمقادير الجبرية | 6. التطابق والتشابه |
| 3. المعادلات الخطية | 7. المساحات والحجوم |
| 4. الزوايا والمضلعات والتحويلات الهندسية | 8. الإحصاء والاحتمالات |

## How to open it

The site is plain HTML/CSS/JavaScript, so there's nothing to install.

- **On your computer:** download the repository (green **Code** button → **Download ZIP**), unzip it, and double-click `index.html`.
- **Free online with GitHub Pages:** in this repository on GitHub, go to **Settings → Pages**. Under "Build and deployment", pick **Deploy from a branch**, choose the `main` branch and the `/ (root)` folder, then click **Save**. After a minute or two the site is live at `https://samerkq77.github.io/7th-Grade-Math/`.
- **On your Linux server** (the one running Docker/WordPress): copy the folder into any web server's document root, for example an `nginx` container serving this folder.

## Files

```
index.html            the page
css/style.css         the design (light notebook theme + dark chalkboard theme)
js/app.js             the app: pages, answer checking, points, quizzes
js/data/unit1..8.js   the lessons and problems (one file per unit)
tools/validate.js     checks the lesson files for mistakes:  node tools/validate.js
tools/CONTENT_GUIDE.md how lesson files are written (to add or edit lessons)
```

To fix a typo or add a problem, edit the matching `js/data/unitN.js` file (you can do it directly on GitHub with the pencil icon), following `tools/CONTENT_GUIDE.md`.
