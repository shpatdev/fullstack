// src/components/Header.jsx
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header style={styles.header}>
      <h1 style={styles.logo}>FDS</h1>
      <nav style={styles.nav}>
        <svg xmlns="http://www.w3.org/2000/svg" 
          width="180"
          height="60"
          viewBox="20 -1.25 24 26"
          fill="none" stroke="black" strokeOpacity="0.75"
          strokeWidth="0.7" stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-circle-user-round-icon lucide-circle-user-round"
          className="animatedLoginIcon"
          style={{}}>
            <path d="M18 20a6 6 0 0 0-12 0" className="animatedLoginIconFill" style={{fill: "#FFD580"}} />
            <path d="M18 20a6 2.2 0 0 1-12 0" className="animatedLoginIconFill" style={{fill: "#FFD580"}} />
            <circle cx="12" cy="10" r="4" className="animatedLoginIconFill" style={{fill: "#FFD580"}} />
            <circle cx="12" cy="12" r="10" />
        </svg>
        <Link to="/restaurants" style={styles.link}>Restaurants</Link>
        {/* Add more links here if needed */}
      </nav>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "#FFA500", // Orange
    color: "white",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  nav: {
    display: "flex",
    gap: "1rem",
    alignItems: "center"
  },
  link: {
    textDecoration: "none",
    color: "black",
    backgroundColor: "#FFD580", // Light Orange
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    transition: "0.3s",
    height: "25px"
  },
};
