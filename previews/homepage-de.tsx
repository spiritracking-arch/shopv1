```jsx
export default function HomePage() {
  const colors = {
    primary: "#1a1a2e",
    secondary: "#16213e",
    accent: "#e94560",
    gold: "#f5a623",
    light: "#f8f9fa",
    muted: "#6c757d",
    white: "#ffffff",
    cardBg: "#ffffff",
    heroBg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  };

  const products = [
    {
      id: 1,
      name: "Ledertasche Premium",
      category: "Accessoires",
      price: "€129,99",
      originalPrice: "€189,99",
      emoji: "👜",
      badge: "Bestseller",
      badgeColor: colors.accent,
      description: "Handgefertigte Ledertasche aus deutschem Vollrindleder",
      rating: 4.8,
      reviews: 142,
    },
    {
      id: 2,
      name: "Mechanische Uhr",
      category: "Uhren",
      price: "€349,00",
      originalPrice: "€499,00",
      emoji: "⌚",
      badge: "Neu",
      badgeColor: colors.gold,
      description: "Präzisionsuhrwerk mit sapphirgehärtetem Glas",
      rating: 4.9,
      reviews: 89,
    },
    {
      id: 3,
      name: "Porzellan Set",
      category: "Wohnen",
      price: "€89,50",
      originalPrice: "€120,00",
      emoji: "🍽️",
      badge: "Sale",
      badgeColor: "#28a745",
      description: "Edles Meissener Porzellan, 12-teiliges Geschirrset",
      rating: 4.7,
      reviews: 203,
    },
  ];

  const renderStars = (rating) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        margin: 0,
        padding: 0,
        backgroundColor: colors.light,
        color: colors.primary,
        overflowX: "hidden",
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "rgba(26, 26, 46, 0.95)",
          backdropFilter: "blur(10px)",
          padding: "0 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "70px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "28px" }}>🦅</span>
          <span
            style={{
              color: colors.white,
              fontSize: "22px",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            Deutsch<span style={{ color: colors.accent }}>Markt</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          {["Entdecken", "Kategorien", "Angebote", "Über uns"].map((item) => (
            <a
              key={item}
              href="#"
              style={{
                color: "rgba(255,255,255,0.8)",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                letterSpacing: "0.5px",
                transition: "color 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.target.style.color = colors.accent)}
              onMouseLeave={(e) =>
                (e.target.style.color = "rgba(255,255,255,0.8)")
              }
            >
              {item}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: colors.white,
              fontSize: "20px",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            🔍
          </button>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: colors.white,
              fontSize: "20px",
              cursor: "pointer",
              padding: "8px",
              position: "relative",
            }}
          >
            🛒
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                backgroundColor: colors.accent,
                color: colors.white,
                borderRadius: "50%",
                width: "16px",
                height: "16px",
                fontSize: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              3
            </span>
          </button>
          <button
            style={{
              backgroundColor: colors.accent,
              color: colors.white,
              border: "none",
              borderRadius: "25px",
              padding: "10px 22px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            Anmelden
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          background: colors.heroBg,
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          padding: "80px 40px",
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(233,69,96,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(245,166,35,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* German flag stripe decoration */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "6px",
            height: "100%",
            background: "linear-gradient(to bottom, #000000, #DD0000, #FFCE00)",
          }}
        />

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: