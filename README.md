# Claude Panel

Claude Code kullanım istatistiklerini görselleştiren bir dashboard uygulaması. Token kullanımı, maliyet analizi ve oturum geçmişi gibi verileri tek bir arayüzden takip edebilirsiniz.

## Ne İşe Yarar?

Claude Code terminalden çalışırken arka planda `~/.claude` klasörüne oturum loglarını kaydeder. Bu uygulama o logları okuyup size şu bilgileri sunar:

- Toplam token kullanımı ve maliyet
- Günlük/aylık kullanım trendleri
- Proje bazlı istatistikler
- Model bazlı maliyet dağılımı
- Oturum geçmişi ve konuşma detayları
- Maliyet optimizasyon önerileri

## Kurulum

Önce bağımlılıkları yükleyin:

```bash
npm install
```

Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## Yapılandırma

Varsayılan olarak uygulama `~/.claude` klasöründen verileri okur. Farklı bir konum kullanmak istiyorsanız `CLAUDE_DIR` ortam değişkenini ayarlayın:

```bash
CLAUDE_DIR=/path/to/claude npm run dev
```

## Sayfalar

### Dashboard
Ana sayfa. Toplam oturum sayısı, token kullanımı, maliyet ve süre gibi özet istatistikleri gösterir. Günlük kullanım grafiği ve proje dağılımı burada.

### Sessions
Tüm Claude Code oturumlarının listesi. Tarih, proje, model ve maliyet bilgileriyle filtreleyebilirsiniz. Herhangi bir oturuma tıklayarak konuşma detaylarına ulaşabilirsiniz.

### Analytics
Detaylı kullanım analizi. Model bazlı token dağılımı, proje karşılaştırmaları ve günlük trendler burada.

### Costs
Maliyet analizi sayfası. Bu ay / geçen ay karşılaştırması, token türüne göre maliyet dağılımı (input, output, cache read, cache write) ve güncel model fiyatlandırma tablosu.

### Cost Optimization
Kullanım alışkanlıklarınıza göre maliyet düşürme önerileri. Cache verimliliği analizi, model değişikliği önerileri ve en pahalı prompt kalıpları.

## Teknolojiler

- Next.js 16
- React 19
- Tailwind CSS 4
- Recharts (grafikler)
- Radix UI (bileşenler)

## Notlar

- Uygulama sadece okuma yapar, log dosyalarını değiştirmez
- Veriler sunucu tarafında işlenir, API key gerekmez
- Dark mode destekler

## Lisans

MIT
