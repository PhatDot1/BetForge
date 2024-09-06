import React, { useState, useContext } from "react";
import axios from "axios";
import { AssetCard } from "../../components";
import { WalletContext } from "../../contexts/WalletContext";
import "./Soccer.css";

const FootballEvents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [sortOption, setSortOption] = useState("A-Z");
  const [showSidebar, setShowSidebar] = useState(true);

  const { walletAddress } = useContext(WalletContext);

  const players = {
    "Cristiano Ronaldo": ["Portugal vs Spain", "Al Nassr vs X"],
    "Lionel Messi": ["Inter Miami vs Y", "Argentina vs Brazil"],
    "Kylian Mbappe": ["PSG vs Marseille", "France vs Germany"],
    "Erling Haaland": ["Man City vs Liverpool", "Norway vs Sweden"],
  };

  const clubs = {
    "Arsenal": ["Premier League", "FA Cup"],
    "Bayern Munich": ["Bundesliga", "DFB Pokal"],
    "Real Madrid": ["La Liga", "Champions League"],
    "Liverpool": ["Premier League", "FA Cup"],
    "Manchester City": ["Premier League", "FA Cup"],
  };

  const bets = [
    { title: "Cristiano Ronaldo", event: "Portugal vs Spain", price: 0.20, imageSrc: "ronaldo.png", link: "/bet/football/portugal-spain" },
    { title: "Lionel Messi", event: "Argentina vs Brazil", price: 0.25, imageSrc: "messi.png", link: "/bet/football/argentina-brazil" },
    { title: "Arsenal", event: "Premier League - 1st Place", price: 0.18, imageSrc: "arsenal.png", link: "/bet/football/premier-league" },
    { title: "Arsenal", event: "FA Cup - Winner", price: 0.22, imageSrc: "arsenal.png", link: "/bet/football/fa-cup" },
    { title: "Real Madrid", event: "Champions League - Winner", price: 0.30, imageSrc: "realmadrid.png", link: "/bet/football/champions-league" },
    { title: "Liverpool", event: "FA Cup - Winner", price: 0.22, imageSrc: "liverpool.png", link: "/bet/football/fa-cup" },
    { title: "Manchester City", event: "Premier League - 1st Place", price: 0.20, imageSrc: "mancity.png", link: "/bet/football/premier-league-1st" },
    { title: "Manchester City", event: "Premier League - 2nd Place", price: 0.18, imageSrc: "mancity.png", link: "/bet/football/premier-league-2nd" },
    { title: "Manchester City", event: "Premier League - 3rd Place", price: 0.16, imageSrc: "mancity.png", link: "/bet/football/premier-league-3rd" },
    { title: "Manchester City", event: "FA Cup - Winner", price: 0.22, imageSrc: "mancity.png", link: "/bet/football/fa-cup-winner" },
    { title: "Manchester City", event: "FA Cup - Runner-up", price: 0.18, imageSrc: "mancity.png", link: "/bet/football/fa-cup-runnerup" },
    { title: "Manchester City vs Liverpool", event: "FA Cup", price: 0.25, imageSrc: "mancity.png", link: "/bet/football/man-city-liverpool-fa-cup" },
    { title: "Manchester City vs Everton", event: "Premier League", price: 0.20, imageSrc: "mancity.png", link: "/bet/football/man-city-everton-premier-league" },
    { title: "Liverpool vs Chelsea", event: "Premier League", price: 0.22, imageSrc: "liverpool.png", link: "/bet/football/liverpool-chelsea-premier-league" },
    { title: "Real Madrid vs Barcelona", event: "La Liga", price: 0.28, imageSrc: "realmadrid.png", link: "/bet/football/real-madrid-barcelona-la-liga" },
    // Add more items as needed
  ];

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePlayerChange = (player) => {
    setSelectedPlayer(player === selectedPlayer ? null : player); // Toggle selection
    setSelectedClub(null); // Reset club selection
    setSelectedEvent("All"); // Reset event selection
  };

  const handleClubChange = (club) => {
    setSelectedClub(club === selectedClub ? null : club); // Toggle selection
    setSelectedPlayer(null); // Reset player selection
    setSelectedEvent("All"); // Reset event selection
  };

  const handleEventChange = (event) => {
    setSelectedEvent(event);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const sortedBets = bets.sort((a, b) => {
    if (sortOption === "Price: Low to High") {
      return a.price - b.price;
    } else if (sortOption === "Price: High to Low") {
      return b.price - a.price;
    } else if (sortOption === "A-Z") {
      return a.title.localeCompare(b.title);
    } else if (sortOption === "Z-A") {
      return b.title.localeCompare(a.title);
    }
    return 0;
  });

  const filteredBets = sortedBets.filter((bet) => {
    const matchesPlayer = selectedPlayer ? bet.title === selectedPlayer : true;
    const matchesClub = selectedClub ? bet.title.includes(selectedClub) : true;
    const matchesEvent =
      selectedEvent === "All" ||
      (selectedClub &&
        (bet.event.includes(selectedEvent) || bet.event.startsWith(`${selectedEvent} -`)));

    return (
      matchesPlayer &&
      matchesClub &&
      matchesEvent &&
      bet.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleMint = async (bet) => {
    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const response = await axios.post("/mintWormholeNFT", {
        name: bet.title,
        imageSrc: bet.imageSrc,
        walletAddress: walletAddress,
      });

      if (response.data.success) {
        console.log("NFT minted successfully:", response.data);
      } else {
        console.error("Minting failed:", response.data.error);
      }
    } catch (error) {
      console.error("Minting error:", error);
    }
  };

  return (
    <div className="page-container">
      <h1 className="main-heading">Football</h1>
      <h2 className="sub-heading">Upcoming Events:</h2>

      <div className="top-bar">
        <div className="filter-and-results">
          <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
            {showSidebar ? "Hide Filters" : "Show Filters"}
          </button>
          <p className="results-count">{filteredBets.length} Results</p>
        </div>
        <div className="search-and-sort">
          <input
            type="text"
            className="search-bar"
            placeholder="Search by player or club"
            value={searchQuery}
            onChange={handleSearch}
          />
          <select className="sort-dropdown" value={sortOption} onChange={handleSortChange}>
            <option value="A-Z">A-Z</option>
            <option value="Z-A">Z-A</option>
            <option value="Price: Low to High">Price: Low to High</option>
            <option value="Price: High to Low">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="main-content">
        {showSidebar && (
          <div className="sidebar">
            <h2>Filter by Player</h2>
            <div className="filter-group">
              {Object.keys(players).map((player) => (
                <div key={player}>
                  <button
                    className={`filter-btn ${selectedPlayer === player ? "selected" : ""}`}
                    onClick={() => handlePlayerChange(player)}
                  >
                    {player}
                  </button>
                  {selectedPlayer === player && (
                    <div className="nested-dropdown">
                      {players[player].map((match, index) => (
                        <button
                          key={index}
                          className={`nested-btn ${selectedEvent === match ? "selected" : ""}`}
                          onClick={() => handleEventChange(match)}
                        >
                          {match}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <h2>Filter by Club</h2>
            <div className="filter-group">
              {Object.keys(clubs).map((club) => (
                <div key={club}>
                  <button
                    className={`filter-btn ${selectedClub === club ? "selected" : ""}`}
                    onClick={() => handleClubChange(club)}
                  >
                    {club}
                  </button>
                  {selectedClub === club && (
                    <div className="nested-dropdown">
                      {clubs[club].map((league, index) => (
                        <button
                          key={index}
                          className={`nested-btn ${selectedEvent === league ? "selected" : ""}`}
                          onClick={() => handleEventChange(league)}
                        >
                          {league}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={`collections-container ${showSidebar ? "" : "full-width"}`}>
          <div className="collections">
            {filteredBets.map((bet, index) => (
              <AssetCard
                key={index}
                title={bet.title}
                price={`${bet.price} ETH`}
                imageSrc={bet.imageSrc}
                link={bet.link}
                eventType={bet.event}
                mint={() => handleMint(bet)} // Pass mint function
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FootballEvents;
