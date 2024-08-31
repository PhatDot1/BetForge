import React from "react";
import { SlidingCard } from "../../components";
import { HomeCard } from "../../components";
import "./Home.css";
import future from "../../assets/future.jpg"; // Replace with actual image paths

const Home = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <SlidingCard />
      <h3
        style={{
          marginLeft: 70,
          marginTop: 30,
          color: "#ff7f00",
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Collections
      </h3>
      <div className="collections" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        <HomeCard
          name="Soccer"
          price="120 NTF"
          priceRange="Price Range : 0.12BTC - 0.18BTC"
          description="Lorem ipsum dolor sit amet..."
          artist="Léa Jacquot"
          image={future}
          link="/details1"
        />
        <HomeCard
          name="Basketball"
          price="80 NTF"
          priceRange="Price Range : 0.08BTC - 0.12BTC"
          description="Past memories with a touch of nostalgia..."
          artist="Jean Dubois"
          image={future}
          link="/details2"
        />
        <HomeCard
          name="CS-GO"
          price="150 NTF"
          priceRange="Price Range : 0.15BTC - 0.20BTC"
          description="Capture the essence of the moment..."
          artist="Maria Rivera"
          image={future}
          link="/details3"
        />
        <HomeCard
          name="Tennis"
          price="110 NTF"
          priceRange="Price Range : 0.11BTC - 0.16BTC"
          description="A new beginning, a new journey..."
          artist="Ayesha Khan"
          image={future}
          link="/details4"
        />
        <HomeCard
          name="Valorant"
          price="95 NTF"
          priceRange="Price Range : 0.09BTC - 0.14BTC"
          description="The beauty of the evening sky..."
          artist="Kumar Patel"
          image={future}
          link="/details5"
        />
        <HomeCard
          name="Dota 2"
          price="130 NTF"
          priceRange="Price Range : 0.13BTC - 0.19BTC"
          description="The magic hour where day meets night..."
          artist="Yuki Tanaka"
          image={future}
          link="/details6"
        />
      </div>
    </div>
  );
};

export default Home;
