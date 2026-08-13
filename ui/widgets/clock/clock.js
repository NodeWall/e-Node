export const clockWidget = {
  init() {
    this.el = document.getElementById('clock-widget');
    if (!this.el) return;
    this.updateTime();
    this.updateWeather();
    setInterval(() => this.updateTime(), 1000);
    setInterval(() => this.updateWeather(), 600000);
  },
  updateTime() {
    var weekdays = ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота'];
    var months = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
    var now = new Date();
    var hours = String(now.getHours()).padStart(2,'0');
    var minutes = String(now.getMinutes()).padStart(2,'0');
    var day = weekdays[now.getDay()];
    var date = now.getDate();
    var month = months[now.getMonth()];
    var temp = this._weatherTemp != null ? this._weatherTemp : '';
    var desc = this._weatherDesc || '';
    var weatherHtml = '<div class="clock-weather" style="text-align:center;width:100%;">' +
      '<div style="font-size:2.6rem;font-weight:700;color:#f0c29a;">' + (temp ? '+' + temp + '&deg;C' : '—') + '</div>' +
      '<div style="font-size:1.4rem;font-weight:500;color:#888;margin-top:0.6vh;">' + (desc || '—') + '</div>' +
      '</div>';
    this.el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;padding:2vh;box-sizing:border-box;">' +
          weatherHtml +
          '<div class="clock-time" style="font-size:6.5rem;font-weight:800;color:#fff;letter-spacing:0.02em;line-height:1;text-shadow:0 3px 15px rgba(0,0,0,0.5);">' + hours + ':' + minutes + '</div>' +
          '<div class="clock-date" style="font-size:1.4rem;font-weight:500;color:#777;margin-top:0.3vh;">' + date + ' ' + month + '</div>' +
          '<div class="clock-weekday" style="font-size:1.4rem;font-weight:600;color:#ccc;margin-top:0.3vh;letter-spacing:0.1em;text-transform:capitalize;">' + day + '</div></div>';
  },
  async updateWeather() {
    try {
      var res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=50.45&longitude=30.52&current_weather=true');
      if (!res.ok) throw new Error('Weather fetch failed');
      var json = await res.json();
      var t = Math.round(json.current_weather.temperature);
      this._weatherTemp = t;
      this._weatherDesc = this._weatherCodeToText(json.current_weather.weathercode);
    } catch (e) {
      if (this._weatherTemp == null) {
        this._weatherTemp = 22;
        this._weatherDesc = 'Не вдалося оновити';
      }
    }
    this.updateTime();
  },
  _weatherCodeToText(code) {
    if (code === 0) return 'Ясно';
    if (code >= 1 && code <= 3) return 'Мінливо хмари';
    if (code >= 45 && code <= 48) return 'Туман';
    if (code >= 51 && code <= 67) return 'Дощ';
    if (code >= 71 && code <= 77) return 'Сніг';
    if (code >= 80 && code <= 82) return 'Злива';
    if (code >= 95 && code <= 99) return 'Гроза';
    return 'Хмарно';
  }
};
