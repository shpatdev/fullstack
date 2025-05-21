import React, { useEffect, useState } from "react";
import api from "../../api";
import "./RestaurantsList.css";

const RestaurantsList = () => {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    api.get("/restaurants/")
      .then((res) => setRestaurants(res.data))
      .catch((err) => console.error("Error:", err));
  }, []);

  return (
    <div className="restaurant-list">
      {restaurants.map((r) => (
        <div key={r.id} className="restaurant-item">
          <h3>{r.name}</h3>
          <p>{r.address}</p>
          <p>{r.phone}</p>
        </div>
      ))}
    </div>
  );
};

export default RestaurantsList;