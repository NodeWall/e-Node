# Налаштування розпізнавання української мови (STT) для eNode

Цей посібник описує процес налаштування голосового керування та розпізнавання української мови для eNode. Оскільки eNode працює в LXC-контейнері, основною проблемою є маршрутизація аудіо з фізичного мікрофона хоста в контейнер та налаштування прав доступу в браузері Chromium.

## 🛠 Архітектура рішення
Використовується архітектура **Клієнт-Сервер PulseAudio**:
- **Хост (Proxmox):** виступає як PulseAudio-сервер, який має прямий доступ до фізичного мікрофона.
- **LXC (eNode):** виступає як PulseAudio-клієнт, який підключається до сервера через TCP.

---

## 1. Налаштування Хоста (Proxmox)

### Встановлення та конфігурація PulseAudio
1. Встановіть PulseAudio на хості:
   ```bash
   apt update && apt install pulseaudio -y
   ```

2. Налаштуйте сервер для прийому мережевих підключень. Відредагуйте `/etc/pulse/default.pa`, додавши або змінивши наступні рядки:
   ```conf
   # Дозволяє підключення через TCP
   load-module module-native-protocol-tcp auth-ip-acl=127.0.0.1;10.10.10.0/24
   # Дозволяє анонімний доступ (важливо для LXC клієнтів)
   load-module module-native-protocol-tcp auth-anonymous=1
   ```
   *(Замініть `10.10.10.0/24` на вашу підмережу).*

3. Створіть systemd-сервіс для автоматичного запуску PulseAudio на хості (`/etc/systemd/system/pulseaudio-host.service`):
   ```ini
   [Unit]
   Description=PulseAudio Host Server
   After=network.target

   [Service]
   Type=simple
   User=pulse
   ExecStart=/usr/bin/pulseaudio --start --exit-idle-time=-1
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   Запустіть сервіс:
   ```bash
   systemctl enable --now pulseaudio-host.service
   ```

4. **Перевірте мікрофон:** Переконайтеся, що мікрофон не вимкнений (unmuted) і рівень гучності встановлено на 100% через `alsamixer` або `pactl`.

---

## 2. Налаштування LXC-контейнера (eNode)

### Встановлення клієнтських утиліт
Всередині контейнера встановіть необхідні пакети:
```bash
apt update && apt install pulseaudio-utils libasound2-plugins -y
```

### Налаштування середовища
Для того, щоб Chromium та інші програми бачили сервер на хості, необхідно встановити змінну оточення `PULSE_SERVER`. 

Додайте в скрипт запуску Chromium (`/var/www/e-node/deploy/scripts/enode-display-start.sh` або аналогічний):
```bash
export PULSE_SERVER=tcp:IP_ХОСТА:4713
```

---

## 3. Налаштування Chromium (Права доступу)

Для того, щоб мікрофон працював без запитів користувача ("Microphone access denied"), додайте наступні прапорці (flags) до команди запуску `chromium`:

```bash
--use-fake-ui-for-media-stream \
--autoplay-policy=no-user-gesture-required \
--unsafely-treat-insecure-origin-as-secure="http://127.0.0.1:3000"
```
*   `--use-fake-ui-for-media-stream`: автоматично підтверджує запит на доступ до мікрофона.
*   `--unsafely-treat-insecure-origin-as-secure`: дозволяє доступ до мікрофона на локальних HTTP-сайтах (без HTTPS).

---

## 4. Налаштування STT-двигуна (Hermes Agent)

Для якісного розпізнавання української мови без автоматичного перекладу на англійську:

1. **Вибір моделі:** Використовуйте багатомовну модель `base` або `small` (замість `tiny.en`).
2. **Конфігурація мови:** У файлі `~/.hermes/config.yaml` встановіть глобальну мову:
   ```yaml
   stt:
     language: "uk"
   ```
3. **Fallback:** Переконайтеся, що в системі налаштовано автоматичний відкат (fallback) до української мови, якщо модель не змогла визначити мову автоматично.

## 🛠 Усунення проблем

| Помилка | Рішення |
| :--- | :--- |
| **"Microphone access denied"** | Перевірте наявність прапорця `--use-fake-ui-for-media-stream` та `--unsafely-treat-insecure-origin-as-secure` |
| **"Stream error: No such entity"** | Перевірте, чи встановлено `auth-anonymous=1` у `/etc/pulse/default.pa` на хості та чи запущено сервіс PulseAudio |
| **Текст пишеться англійською** | Перевірте `stt.language: "uk"` у конфігурації та переконайтеся, що використовується модель `base` (а не `.en`) |
