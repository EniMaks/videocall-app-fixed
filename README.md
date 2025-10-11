# VideoCall App v2.0.0

Современное приложение для видеозвонков с полной мобильной оптимизацией, построенное с помощью Vue.js и WebRTC.

## 🚀 Новые функции v2.0.0

### Мобильная оптимизация
- **Native-like опыт** на мобильных устройствах
- **Автоматический полноэкранный режим** с ручным управлением
- **Viewport constraints** - приложение точно помещается в экран без прокрутки
- **PWA поддержка** для установки как нативное приложение

### Перетаскиваемое видео
- **Drag & Drop** локального видео окна
- **Изменение размера** с сохранением пропорций 4:3
- **Умные ограничения границ** - видео не перекрывает важные UI элементы
- **Touch поддержка** для мобильных устройств

### Улучшенный UX
- **Всегда видимые элементы управления** в любом режиме
- **Оптимизированные размеры кнопок** для touch-интерфейса
- **Плавные анимации** и переходы
- **Кроссбраузерная совместимость**

## Основные возможности

- Создание и присоединение к комнатам видеозвонков
- Peer-to-peer видео и аудио связь
- Простой и интуитивный интерфейс
- Управление камерой и микрофоном
- Полноэкранный режим с автоматическим переходом на мобильных
- Перетаскиваемое и масштабируемое локальное видео

## Технологии

- **Frontend**: Vue.js 3 с Composition API
- **WebRTC**: Для peer-to-peer соединений
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Mobile**: PWA с полной мобильной оптимизацией

## 👥 Роли пользователей

Система поддерживает два типа пользователей:

1.  **Аутентифицированный пользователь**:
    *   Входит в систему по основному паролю доступа.
    *   Может создавать новые комнаты для видеозвонков.
    *   Может генерировать гостевые ссылки для своих комнат.
    *   Может присоединяться к любой комнате, зная ее ID.

2.  **Гость**:
    *   Не имеет пароля и не может войти в систему.
    *   Может присоединиться к звонку **только** по специальной гостевой ссылке, полученной от аутентифицированного пользователя.
    *   После перехода по ссылке сразу попадает в комнату, минуя страницу ввода пароля.

## 🏗️ Архитектура

```
📦 Video Call App
├── 🐍 Backend (Django)
│   ├── REST API
│   ├── WebSocket (Channels)
│   ├── Redis (кэширование и сессии)
│   └── PostgreSQL (база данных)
├── 🖥️ Frontend (Vue.js 3)
│   ├── Composition API
│   ├── Pinia (управление состоянием)
│   ├── TailwindCSS (стили)
│   └── WebRTC (видеосвязь)
└── 🐳 Docker
    ├── Nginx (прокси)
    ├── PostgreSQL
    ├── Redis
    └── SSL/HTTPS
```

## 🔌 API Эндпоинты

Основная часть взаимодействия фронтенда с бэкендом происходит через REST API.

### Генерация гостевой ссылки

- **Эндпоинт**: `POST /api/rooms/<room_id>/generate-guest-link`
- **Описание**: Создает временную JWT-ссылку для гостевого доступа в указанную комнату.
- **Аутентификация**: Требуется (запрос должен быть отправлен от аутентифицированного пользователя).
- **Пример ответа**:
  ```json
  {
    "guest_url": "https://your.domain.com/#/room/ROOM_ID?guest_token=...",
    "guest_qr_code": "data:image/png;base64,...",
    "guest_token": "ey..."
  }
  ```

## 🚀 Быстрый старт

Рекомендуемый и самый простой способ запуска проекта — с помощью Docker.

### Запуск с Docker Compose (Рекомендуется)

Этот метод автоматически настраивает и запускает все необходимые сервисы (Backend, Frontend, PostgreSQL, Redis) в изолированных контейнерах.

1.  **Установите Docker и Docker Compose.**
2.  **Создайте `.env` файл** из примера в корне проекта:
    ```bash
    cp env.example .env
    ```
    *Вам может понадобиться отредактировать этот файл, указав ваш домен и другие параметры для продакшн-среды, но для первого локального запуска достаточно стандартных значений.*
3.  **Запустите контейнеры:**
    ```bash
    docker-compose up --build
    ```
4.  **Создайте суперпользователя** (в отдельном терминале):
    ```bash
    docker-compose exec backend python manage.py createsuperuser
    ```
5.  **Приложение будет доступно:**
    -   Frontend: `http://localhost` (или по порту, указанному в `docker-compose.yml`)
    -   Admin панель: `http://localhost/admin`

### Локальная разработка (без Docker)

Этот метод предназначен для разработки, когда нет возможности использовать Docker. Он использует SQLite вместо PostgreSQL и кэш в памяти вместо Redis. Все изменения в `settings.py` уже внесены для поддержки этого режима.

#### 1. Настройка окружения

Вам понадобится два `.env` файла для настройки бэкенда и фронтенда.

1.  **Для Бэкенда:** Создайте файл `.env` в **корневой папке проекта** (`videocall-app/.env`) со следующим содержимым. Этот файл переключит Django в режим разработки.
    ```
    # Включает режим разработки для бэкенда
    DJANGO_ENV=development
    # Простой секретный ключ для локальной разработки
    SECRET_KEY=your-local-secret-key
    ```

2.  **Для Фронтенда:** Создайте файл `.env` в папке **`videocall-frontend/`** (`videocall-app/videocall-frontend/.env`) со следующим содержимым. Этот файл укажет фронтенду правильный адрес локального бэкенда.
    ```
    VITE_API_BASE_URL=http://localhost:8000/api
    VITE_WS_HOST=localhost:8000
    ```

#### 2. Запуск Бэкенда

Откройте **первый терминал**.

1.  **Перейдите в папку бэкенда:**
    ```bash
    cd backend
    ```
2.  **Создайте и активируйте виртуальное окружение:**
    ```bash
    # Для Windows
    python -m venv .venv
    .venv\Scripts\activate

    # Для macOS/Linux
    python3 -m venv .venv
    source .venv/bin/activate
    ```
3.  **Установите зависимости:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Установите совместимую версию pyOpenSSL** (важно для Daphne на Windows):
    ```bash
    pip install pyOpenSSL==23.2.0
    ```
5.  **Примените миграции** для создания локальной базы данных `db.sqlite3`:
    ```bash
    python manage.py migrate
    ```
6.  **Запустите ASGI-сервер Daphne** (не `runserver`!), который поддерживает WebSockets:
    ```bash
    daphne -b 0.0.0.0 -p 8000 videocall_app.asgi:application
    ```
    *Вы должны увидеть в консоли сообщение `🚀 Running in DEVELOPMENT mode`.*

#### 3. Запуск Фронтенда

Откройте **второй терминал**.

1.  **Перейдите в папку фронтенда:**
    ```bash
    cd videocall-frontend
    ```
2.  **Установите зависимости:**
    ```bash
    npm install
    ```
3.  **Запустите сервер для разработки:**
    ```bash
    npm run dev
    ```
    *В консоли появится адрес, по которому доступен фронтенд (обычно `http://localhost:5173`).*

#### 3.5. Настройка TURN сервера (рекомендуется)

Для полной функциональности WebRTC в локальной разработке рекомендуется запустить TURN сервер. Без него видеозвонки могут не работать через NAT/firewall.

##### Вариант 1: Docker (рекомендуется для всех ОС)

Запустите Coturn в Docker контейнере:

```bash
docker run -d --name coturn \
  -p 3478:3478/tcp -p 3478:3478/udp -p 49152-49251:49152-49251/udp \
  -v $(pwd)/coturn/turnserver.conf:/etc/coturn/turnserver.conf:ro \
  coturn/coturn \
  -c /etc/coturn/turnserver.conf --user=turnuser:supersecretturnpassword
```

##### Вариант 2: Нативная установка

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install coturn
```

**Windows (с помощью Chocolatey):**
```powershell
# Установите Chocolatey, если не установлен
# choco install coturn
# Или скачайте бинарники с https://github.com/coturn/coturn/releases
```

**macOS (с помощью Homebrew):**
```bash
brew install coturn
```

2.  **Запустите TURN сервер** (в четвертом терминале):

**Linux/macOS:**
```bash
# Рекомендуемый способ - с помощью скрипта
./start-turn-server.sh

# Или вручную
turnserver -c coturn/turnserver.conf --user=turnuser:supersecretturnpassword
```

**Windows (PowerShell):**
```powershell
# Рекомендуемый способ - с помощью скрипта
.\start-turn-server.ps1

# Или вручную
turnserver -c coturn/turnserver.conf --user=turnuser:supersecretturnpassword
# Или укажите полный путь к бинарнику
# C:\path\to\turnserver.exe -c coturn/turnserver.conf --user=turnuser:supersecretturnpassword
```

*TURN сервер будет доступен на порту 3478.*

3.  **Обновите переменные окружения фронтенда** в `videocall-frontend/.env`:
    ```
    VITE_TURN_URL=turn:127.0.0.1:3478
    VITE_TURN_USERNAME=turnuser
    VITE_TURN_CREDENTIAL=supersecretturnpassword
    ```

#### 4. Создание пользователя

1.  Откройте **третий терминал**.
2.  Перейдите в папку бэкенда и активируйте виртуальное окружение, как в шаге 2.
3.  Выполните команду:
    ```bash
    python manage.py createsuperuser
    ```
4.  Следуйте инструкциям для создания вашего логина и пароля.

После выполнения всех шагов, вы можете открыть фронтенд в браузере (`http://localhost:5173`) и войти в систему, используя созданные учетные данные.

## 📋 Системные требования

- **Сервер**: Ubuntu 20.04+ или аналогичная Linux-система
- **RAM**: Минимум 2GB, рекомендуется 4GB+
- **CPU**: 2+ ядра
- **Диск**: 20GB+ свободного места
- **Сеть**: Статический IP или домен для SSL

## 🛠️ Развертывание на продакшене

### 1. Подготовка сервера

Обновите систему и установите необходимые пакеты:

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
```

### 2. Установка Docker

**Добавление ключей и репозитория Docker:**
```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
```

**Установка Docker и компонентов:**
```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**Добавление пользователя в группу Docker:**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Установка Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 4. Установка Nginx и Certbot

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

### 5. Настройка SSL-сертификатов

**Получение сертификатов Let's Encrypt:**
```bash
sudo certbot --nginx -d <yourdomain.com> -d <www.yourdomain.com>
```

**Остановка системного Nginx после получения сертификатов:**
```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### 6. Конфигурация проекта

**Создайте файл окружения:**
```bash
cp env.example .env
```

**Настройте переменные в `.env`:**
```bash
# Основные настройки
DEBUG=False
SECRET_KEY=your-super-secret-django-key-here
DOMAIN_NAME=<yourdomain.com>

# База данных
POSTGRES_PASSWORD=strong-database-password

# Пути к SSL сертификатам
SSL_CERT_PATH=/etc/letsencrypt/live/<yourdomain.com>/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/<yourdomain.com>/privkey.pem

# Домены
ALLOWED_HOSTS=<yourdomain.com>,<www.yourdomain.com>
CORS_ALLOWED_ORIGINS=https://<yourdomain.com>,https://<www.yourdomain.com>
```

**Обновите nginx.conf:**
Замените `<yourdomain.com>` на ваш реальный домен в файле `nginx.conf`.

### 7. Запуск приложения

**Сборка и запуск контейнеров:**
```bash
docker-compose up --build -d
```

**Создание суперпользователя:**
```bash
docker-compose exec backend python manage.py createsuperuser
```

**Проверка статуса контейнеров:**
```bash
docker-compose ps
```

### 8. Проверка работоспособности

- **Frontend**: https://<yourdomain.com>
- **Backend API**: https://<yourdomain.com>/api/health/
- **Admin панель**: https://<yourdomain.com>/admin/
- **WebSocket**: wss://<yourdomain.com>/ws/

## Документация

### 📚 Подробные руководства
- [`docs/MOBILE_OPTIMIZATION.md`](docs/MOBILE_OPTIMIZATION.md) - Мобильная оптимизация
- [`docs/FULLSCREEN_FEATURES.md`](docs/FULLSCREEN_FEATURES.md) - Полноэкранные функции
- [`docs/DRAGGABLE_VIDEO.md`](docs/DRAGGABLE_VIDEO.md) - Перетаскиваемое видео
- [`docs/README.md`](docs/README.md) - Индекс документации
- [`CHANGELOG.md`](CHANGELOG.md) - История изменений

## Использование

### Мобильные функции
- **Автоматический полноэкранный режим**: Активируется автоматически на мобильных устройствах
- **Перетаскивание видео**: Удерживайте и перетаскивайте локальное видео
- **Изменение размера**: Потяните за правый нижний угол видео окна
- **Выход из полноэкранного режима**: Используйте кнопку в правом верхнем углу

## 📊 Мониторинг

### Health Check эндпоинты

- **Общее состояние**: `/api/health/`
- **Метрики системы**: `/api/metrics/` (только для админов)

### Логи

```bash
# Все логи
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f nginx
docker-compose logs -f db
```

## 🛡️ Безопасность

### Рекомендации по безопасности

1. **Измените пароль по умолчанию** в админ-панели
2. **Используйте сложные пароли** для базы данных
3. **Регулярно обновляйте** SSL-сертификаты
4. **Настройте файрвол** для ограничения доступа
5. **Мониторьте логи** на предмет подозрительной активности

### Настройка файрвола (UFW)

```bash
# Разрешить SSH, HTTP и HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🔧 Разработка

### Структура проекта

```
📁 video-call-app/
├── 📁 backend/                 # Django backend
│   ├── 📁 apps/               # Django приложения
│   │   ├── 📁 authentication/ # Система аутентификации
│   │   ├── 📁 core/          # Основные модели и утилиты
│   │   └── 📁 rooms/         # Управление комнатами
│   ├── 📁 videocall_app/     # Основные настройки Django
│   └── 🐳 Dockerfile
├── 📁 videocall-frontend/     # Vue.js frontend
│   ├── 📁 src/
│   │   ├── 📁 components/    # Vue компоненты
│   │   ├── 📁 stores/        # Pinia хранилища
│   │   ├── 📁 services/      # API и утилиты
│   │   └── 📁 router/        # Vue Router
│   └── 🐳 Dockerfile
├── 🐳 docker-compose.yml     # Docker Compose конфигурация
├── 📄 nginx.conf             # Nginx конфигурация
└── 📄 .env.example           # Пример переменных окружения
```

### Локальная разработка

```bash
# Backend (Python/Django)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver

# Frontend (Vue.js)
cd videocall-frontend
npm install
npm run dev
```

## Лицензия

MIT License