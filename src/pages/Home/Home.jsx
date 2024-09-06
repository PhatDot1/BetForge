import React from "react";
import { SlidingCard } from "../../components";
import { HomeCard } from "../../components";
import "./Home.css";
import footballImage from "../../assets/football.jpg"; // Replace with actual image paths
import basketballImage from "../../assets/basketball.jpg";
import csgoImage from "../../assets/csgo.jpg";
import tennisImage from "../../assets/tennis.jpg";
import valorantImage from "../../assets/valorant.jpg";
import dota2Image from "../../assets/dota2.jpg";

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
        Popular Events
      </h3>
      <div className="collections" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        <HomeCard
          name="Soccer"
          price="120 NFT's"
          priceRange="Price Range : 0.12BTC - 0.18BTC"
          description="Lorem ipsum ipsum dolor sit amet..."
          image={footballImage}
          link="/bet/soccer"
        />
        <HomeCard
          name="Basketball"
          price="80 NFT's"
          priceRange="Price Range : 0.08BTC - 0.12BTC"
          description="Past memories with a touch of nostalgia..."
          image={basketballImage}
          link="/bet/basketball"
        />
        <HomeCard
          name="CS-GO"
          price="150 NFT's"
          priceRange="Price Range : 0.15BTC - 0.20BTC"
          description="Capture the essence of the moment..."
          image={csgoImage}
          link="/bet/csgo"
        />
        <HomeCard
          name="Tennis"
          price="110 NFT's"
          priceRange="Price Range : 0.11BTC - 0.16BTC"
          description="A new beginning, a new journey..."
          image={tennisImage}
          link="/bet/tennis"
        />
        <HomeCard
          name="Valorant"
          price="95 NFT's"
          priceRange="Price Range : 0.09BTC - 0.14BTC"
          description="The beauty of the evening sky..."
          image={valorantImage}
          link="/bet/valorant"
        />
        <HomeCard
          name="Dota 2"
          price="130 NFT's"
          priceRange="Price Range : 0.13BTC - 0.19BTC"
          description="The magic hour where day meets night..."
          image={dota2Image}
          link="/bet/dota2"
        />
      </div>
    </div>
  );
};

export default Home;
