import { useEffect, useState } from "react";
import api from "../../api";
import './Restaurants.css'

export default function Restaurants() {
  const [commentNumber, setCommentNumber] = useState(1);
  const [data, setData] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.get("/restaurants/").then((res) => setData(res.data));
  }, []);

  useEffect(() => {
    setTimeout(() => {
      console.log(reviews);
    }, 0)
  }, [reviews]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        minHeight: "fit-content",
        height: "50vh",
        width: "100%",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          maxWidth: "100%",
          width: "fit-content",
          padding: "55px",
          // borderRadius: "16px",
          backgroundColor: "rgba(240, 240, 240, 0.6)",
          fontWeight: "bold",
          justifyContent: "center",
          // alignItems: "center",
          justifyItems: "center",
          // alignItems: "center"
        }}
      >
        <div 
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            position: "absolute",
            top: "0%",
            height: "39px",
            width: "100%", 
            textAlign: "center", 
            color: "rgba(25, 25, 25, 0.8)",
            backgroundColor: "rgba(240, 240, 240, 0.6)",
            borderBottom: "2px solid rgba(25, 25, 25, 0.8)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "start",
              width: "50%",
            }}
          >
            <h1 style={{position: "relative", left: "6%"}}>
              Restaurants
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "end",
              alignItems: "center",
              width: "50%",
              height: "100%",
              paddingRight: "20px",
            }}
          >
            <label style={{gap: "5px", display: "flex"}}>
              Arrange Only
              <input 
                type="checkbox" 
                defaultChecked
                style={{accentColor: "rgba(251, 78, 51, 0.7)"}}
              />
            </label>
          </div>
        </div>

        {data.map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "fit-content",
              width: "272px",
              maxWidth: "272px",
              // maxWidth: "258px",
              border: "1px solid rgba(128, 128, 128, 1)",
              borderRadius: "1%",
              backgroundColor: "rgba(253, 246, 227, 1)",
              padding: "10px",
              paddingBottom: "20px",
              gap: "5px",
            }}
          >
            {r.image && (
              <img
                src={`${r.image}`}
                alt={r.name}
                style={{
                  width: "250px",
                  height: "250px",
                  objectFit: "cover",
                  border: "2px solid rgba(158, 158, 158, 1)",
                  borderRadius: "1%",
                  // borderTopLeftRadius: "8px",
                  marginBottom: "10px",
                }}
              />
            )}
            <div style={{color: "rgba(50, 50, 50, 0.8)",}}>{r.name}</div>
            <button id="btn" 
              onClick={() => 
                {
                  toggleExpand(r.id);
                  if(!expanded[r.id]) {
                    setCommentNumber(1);
                  }
                  api.get(`/reviews/?restaurant=${r.id}`).then((res) => setReviews(res.data));  
                }
              }>
              {expanded[r.id] ? "Hide Reviews" : "Show Reviews"}
            </button>
            {expanded[r.id] && (
              <div
                style={{
                  borderTop: "1px solid rgba(128, 128, 128, 0.4)",
                  borderBottom: "1px solid rgba(128, 128, 128, 0.4)",
                  // borderLeft: "1px solid rgba(128, 128, 128, 0.4)",
                  // borderRight: "1px solid rgba(128, 128, 128, 0.4)",
                  borderRadius: "1%",
                  marginTop: "20px",
                  textAlign: "left",
                  paddingTop: "5px",
                  paddingBottom: "5px",
                  animation: expanded[r.id] ? "2s expandTile ease" : "2s expandTile reverse"
                }}
              >
                {reviews.slice(0,commentNumber).map((rev) => {
                  return (
                  <>
                    <p
                      key={rev.id}
                      id = "comment"
                    >
                      {rev.comment}
                    </p>
                  </>
                  )
                })}
                <p
                  id="loadComment"
                  onClick={() => {
                    setCommentNumber(commentNumber+1);
                  }}
                >
                  ...
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
