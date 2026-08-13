# eNode Host Files

Цей каталог містить увесь конфіг та скрипти проекту eNode для поточної ноди Proxmox.
При клонуванні на іншу ноду достатньо скопіювати цей каталог і симлінки в `/etc/systemd/system/`.

## Вміст

| Файл | Призначення |
|------|-------------|
| `xorg-kiosk.service` | systemd-сервіс для голеї Xorg на `:0` |
| `kiosk-start.sh` | запуск Chromium у LXC 300 через `pct exec` |
| `display-ctl.service` | oneshot-сервіс: `xset dpms force off/on` |
| `display-ctl.socket` | слухає `127.0.0.1:7380`, приймає з’єднання для дисплея |
| `metrics-publisher.sh` | збір метрик хоста → публікація в MQTT `127.0.0.1:1883` |
| `mosquitto.conf` | конфіг локального Mosquitto |
| `README.md` | цей файл |

## Системні залежності

- `mosquitto` — MQTT брокер (встановлюється окремо)
- `mosquitto-clients` — утиліта `mosquitto_pub` для паблікації метрик
- `xserver-xorg-core`, `libinput`, `mesa` — графічний стек

## Сервіси

| Сервіс / Socket | Статус | Призначення |
|-----------------|--------|-------------|
| `xorg-kiosk.service` | enabled/active | Xorg на `:0`, дисплей `eDP-1` 1920×1280 |
| `display-ctl.socket` | enabled/active | приймає команди дисплея з LXC |
| `metrics-publisher.service` | enabled/active | публікує метрики в топік `enode/host/metrics` кожні 10–15с |

## Клонування на нову ноду

1. Скопіювати каталог `/opt/enode/` на новий хост.
2. Створити симлінки:
   - `ln -s /opt/enode/xorg-kiosk.service /etc/systemd/system/xorg-kiosk.service`
   - `ln -s /opt/enode/display-ctl.service /etc/systemd/system/display-ctl.service`
   - `ln -s /opt/enode/display-ctl.socket /etc/systemd/system/display-ctl.socket`
3. Виконати `systemctl daemon-reload`.
4. Встановити залежності: `apt install mosquitto mosquitto-clients xserver-xorg-core libinput-bin mesa-...`.
5. Ввімкнути сервіси: `systemctl enable --now xorg-kiosk.service display-ctl.socket metrics-publisher.service`.
