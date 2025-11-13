import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  // Core state
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("");
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Advanced features state
  const [searchHistory, setSearchHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [team, setTeam] = useState([]);
  const [pokemonList, setPokemonList] = useState([]);
  const [evolutionChain, setEvolutionChain] = useState(null);
  const [compareList, setCompareList] = useState([]);

  // UI state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pokemonSpecies, setPokemonSpecies] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    generation: "",
    minStats: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pokemonPerPage = 20;

  const inputRef = useRef(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("pokemonSearchHistory");
    const savedFavorites = localStorage.getItem("pokemonFavorites");
    const savedTeam = localStorage.getItem("pokemonTeam");

    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedTeam) setTeam(JSON.parse(savedTeam));
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem("pokemonSearchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem("pokemonFavorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("pokemonTeam", JSON.stringify(team));
  }, [team]);

  // Load initial Pokémon list for Pokédex
  useEffect(() => {
    if (activeTab === "pokedex") {
      loadPokemonList();
    }
  }, [activeTab]);

  const loadPokemonList = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://pokeapi.co/api/v2/pokemon?limit=1000"
      );
      const data = await response.json();
      setPokemonList(data.results);
    } catch (error) {
      console.warn("Failed to load pokemon list:", error);
      setError("Failed to load Pokémon list");
    } finally {
      setLoading(false);
    }
  };

  const fetchPokemonData = async (pokemonName) => {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const fetchPokemonSpecies = async (pokemonId) => {
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`
      );
      if (response.ok) return await response.json();
    } catch (error) {
      console.warn("Failed to fetch pokemon species:", error);
    }
    return null;
  };

  const fetchEvolutionChain = async (evolutionChainUrl) => {
    try {
      const response = await fetch(evolutionChainUrl);
      if (response.ok) return await response.json();
    } catch (error) {
      console.warn("Failed to fetch evolution chain:", error);
    }
    return null;
  };

  const getRandomPokemon = () => {
    const randomId = Math.floor(Math.random() * 1010) + 1;
    setQuery(randomId.toString());
    searchPokemon(randomId.toString());
  };

  const addToHistory = (pokemonName) => {
    const newHistory = [
      pokemonName,
      ...searchHistory.filter((name) => name !== pokemonName),
    ].slice(0, 10);
    setSearchHistory(newHistory);
  };

  const toggleFavorite = (pokemonData) => {
    const pokemonInfo = {
      id: pokemonData.id,
      name: pokemonData.name,
      sprite: pokemonData.sprites.front_default,
      types: pokemonData.types,
    };

    const isAlreadyFavorite = favorites.some(
      (fav) => fav.id === pokemonData.id
    );
    if (isAlreadyFavorite) {
      setFavorites(favorites.filter((fav) => fav.id !== pokemonData.id));
    } else {
      setFavorites([pokemonInfo, ...favorites].slice(0, 20));
    }
  };

  const addToTeam = (pokemonData) => {
    if (team.length >= 6) {
      setError("Team is full! Maximum 6 Pokémon allowed.");
      return;
    }

    const pokemonInfo = {
      id: pokemonData.id,
      name: pokemonData.name,
      sprite: pokemonData.sprites.front_default,
      types: pokemonData.types,
      stats: pokemonData.stats,
    };

    const isAlreadyInTeam = team.some((member) => member.id === pokemonData.id);
    if (!isAlreadyInTeam) {
      setTeam([...team, pokemonInfo]);
      setError("");
    } else {
      setError("This Pokémon is already in your team!");
    }
  };

  const removeFromTeam = (pokemonId) => {
    setTeam(team.filter((member) => member.id !== pokemonId));
  };

  const addToCompare = (pokemonData) => {
    if (compareList.length >= 4) {
      setError("Maximum 4 Pokémon can be compared at once.");
      return;
    }

    const pokemonInfo = {
      id: pokemonData.id,
      name: pokemonData.name,
      sprite: pokemonData.sprites.front_default,
      types: pokemonData.types,
      stats: pokemonData.stats,
      height: pokemonData.height,
      weight: pokemonData.weight,
    };

    const isAlreadyInCompare = compareList.some(
      (comp) => comp.id === pokemonData.id
    );
    if (!isAlreadyInCompare) {
      setCompareList([...compareList, pokemonInfo]);
    }
  };

  const removeFromCompare = (pokemonId) => {
    setCompareList(compareList.filter((comp) => comp.id !== pokemonId));
  };

  const isFavorite = (pokemonId) =>
    favorites.some((fav) => fav.id === pokemonId);
  const isInTeam = (pokemonId) =>
    team.some((member) => member.id === pokemonId);

  const searchPokemon = async (searchQuery = null) => {
    const queryToSearch = searchQuery || query.trim();
    if (!queryToSearch) {
      setError("Please enter a Pokémon name or ID");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setPokemon(null);
      setPokemonSpecies(null);
      setEvolutionChain(null);
      setShowSuggestions(false);

      const pokemonData = await fetchPokemonData(queryToSearch);
      const speciesData = await fetchPokemonSpecies(pokemonData.id);

      setPokemon(pokemonData);
      setPokemonSpecies(speciesData);
      addToHistory(pokemonData.name);

      // Load evolution chain
      if (speciesData?.evolution_chain?.url) {
        const evolutionData = await fetchEvolutionChain(
          speciesData.evolution_chain.url
        );
        setEvolutionChain(evolutionData);
      }
    } catch {
      setError(`Pokémon "${queryToSearch}" not found.`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") searchPokemon();
  };

  const handleInputFocus = () => setShowSuggestions(true);
  const handleInputBlur = () =>
    setTimeout(() => setShowSuggestions(false), 200);

  const selectSuggestion = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    searchPokemon(suggestion);
    inputRef.current?.focus();
  };

  const clearHistory = () => setSearchHistory([]);
  const clearFavorites = () => setFavorites([]);
  const clearTeam = () => setTeam([]);
  const clearCompare = () => setCompareList([]);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getFlavorText = (species) => {
    if (!species?.flavor_text_entries) return "";
    const englishEntry = species.flavor_text_entries.find(
      (entry) => entry.language.name === "en"
    );
    return englishEntry?.flavor_text.replace(/\\f/g, " ") || "";
  };

  const getEvolutionChainDisplay = (chain) => {
    const evolutions = [];
    let current = chain?.chain;

    while (current) {
      evolutions.push({
        name: current.species.name,
        id: current.species.url.split("/").slice(-2, -1)[0],
      });
      current = current.evolves_to[0];
    }

    return evolutions;
  };

  // Components
  const TabNavigation = () => (
    <div className="tab-navigation">
      {[
        { id: "search", label: "🔍 Search", icon: "🔍" },
        { id: "pokedex", label: "📱 Pokédex", icon: "📱" },
        { id: "team", label: "👥 Team Builder", icon: "👥" },
        { id: "compare", label: "⚔️ Compare", icon: "⚔️" },
        { id: "favorites", label: "❤️ Favorites", icon: "❤️" },
      ].map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  const Suggestions = () => {
    if (
      !showSuggestions ||
      (searchHistory.length === 0 && favorites.length === 0)
    )
      return null;

    return (
      <div className="suggestions">
        {searchHistory.length > 0 && (
          <div className="suggestion-section">
            <div className="suggestion-header">
              <h4>Recent Searches</h4>
              <button onClick={clearHistory} className="clear-btn">
                Clear
              </button>
            </div>
            {searchHistory.map((pokemon, index) => (
              <button
                key={index}
                className="suggestion-item"
                onClick={() => selectSuggestion(pokemon)}
              >
                {capitalizeFirstLetter(pokemon)}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const PokemonCard = ({ pokemon, species, showActions = true }) => {
    const imageUrl =
      pokemon.sprites.front_default || pokemon.sprites.front_shiny;
    const shinyImageUrl = pokemon.sprites.front_shiny;
    const [showShiny, setShowShiny] = useState(false);

    return (
      <div className="pokemon-card">
        <div className="pokemon-image-container">
          <img
            src={showShiny && shinyImageUrl ? shinyImageUrl : imageUrl}
            alt={pokemon.name}
            className="pokemon-image"
          />
          {shinyImageUrl && (
            <button
              className="shiny-toggle"
              onClick={() => setShowShiny(!showShiny)}
              title={showShiny ? "Show Normal" : "Show Shiny"}
            >
              ✨
            </button>
          )}
          {showActions && (
            <div className="action-buttons">
              <button
                className={`action-btn ${
                  isFavorite(pokemon.id) ? "favorited" : ""
                }`}
                onClick={() => toggleFavorite(pokemon)}
                title="Add to favorites"
              >
                {isFavorite(pokemon.id) ? "❤️" : "🤍"}
              </button>
              <button
                className={`action-btn ${
                  isInTeam(pokemon.id) ? "in-team" : ""
                }`}
                onClick={() => addToTeam(pokemon)}
                title="Add to team"
              >
                👥
              </button>
              <button
                className="action-btn"
                onClick={() => addToCompare(pokemon)}
                title="Add to compare"
              >
                ⚔️
              </button>
            </div>
          )}
        </div>

        <div className="pokemon-info">
          <h2 className="pokemon-name">
            {capitalizeFirstLetter(pokemon.name)}
          </h2>
          <p className="pokemon-id">
            #{pokemon.id.toString().padStart(3, "0")}
          </p>

          {species && getFlavorText(species) && (
            <p className="pokemon-description">{getFlavorText(species)}</p>
          )}

          <div className="pokemon-types">
            {pokemon.types.map((typeInfo, index) => (
              <span key={index} className={`type type-${typeInfo.type.name}`}>
                {capitalizeFirstLetter(typeInfo.type.name)}
              </span>
            ))}
          </div>

          <div className="pokemon-basic-stats">
            <p>
              <strong>Height:</strong> {pokemon.height / 10} m
            </p>
            <p>
              <strong>Weight:</strong> {pokemon.weight / 10} kg
            </p>
            <p>
              <strong>Base Experience:</strong> {pokemon.base_experience}
            </p>
          </div>

          <button
            className="stats-toggle"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? "Hide" : "Show"} Detailed Stats
          </button>

          {showStats && (
            <div className="detailed-stats">
              <h3>Base Stats</h3>
              <div className="stats-grid">
                {pokemon.stats.map((stat) => (
                  <div key={stat.stat.name} className="stat-item">
                    <span className="stat-name">
                      {capitalizeFirstLetter(stat.stat.name.replace("-", " "))}:
                    </span>
                    <span className="stat-value">{stat.base_stat}</span>
                    <div className="stat-bar">
                      <div
                        className="stat-fill"
                        style={{ width: `${(stat.base_stat / 255) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <h3>Abilities</h3>
              <div className="abilities">
                {pokemon.abilities.map((ability, index) => (
                  <span key={index} className="ability">
                    {capitalizeFirstLetter(
                      ability.ability.name.replace("-", " ")
                    )}
                    {ability.is_hidden && " (Hidden)"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {evolutionChain && (
            <div className="evolution-chain">
              <h3>Evolution Chain</h3>
              <div className="evolutions">
                {getEvolutionChainDisplay(evolutionChain).map((evo, index) => (
                  <div key={index} className="evolution-item">
                    <button
                      className="evolution-btn"
                      onClick={() => searchPokemon(evo.name)}
                    >
                      {capitalizeFirstLetter(evo.name)}
                    </button>
                    {index <
                      getEvolutionChainDisplay(evolutionChain).length - 1 && (
                      <span className="evolution-arrow">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const TeamBuilder = () => (
    <div className="team-builder">
      <div className="section-header">
        <h2>👥 Team Builder</h2>
        <div className="team-controls">
          <span className="team-count">{team.length}/6 Pokémon</span>
          {team.length > 0 && (
            <button onClick={clearTeam} className="clear-team-btn">
              Clear Team
            </button>
          )}
        </div>
      </div>

      {team.length === 0 ? (
        <div className="empty-team">
          <p>
            Your team is empty. Search for Pokémon and add them to your team!
          </p>
        </div>
      ) : (
        <div className="team-grid">
          {team.map((member) => (
            <div key={member.id} className="team-member">
              <img
                src={member.sprite}
                alt={member.name}
                className="team-sprite"
              />
              <h4>{capitalizeFirstLetter(member.name)}</h4>
              <div className="member-types">
                {member.types.map((type, index) => (
                  <span
                    key={index}
                    className={`type-small type-${type.type.name}`}
                  >
                    {capitalizeFirstLetter(type.type.name)}
                  </span>
                ))}
              </div>
              <button
                onClick={() => removeFromTeam(member.id)}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ComparisonTool = () => (
    <div className="comparison-tool">
      <div className="section-header">
        <h2>⚔️ Pokémon Comparison</h2>
        {compareList.length > 0 && (
          <button onClick={clearCompare} className="clear-compare-btn">
            Clear All
          </button>
        )}
      </div>

      {compareList.length === 0 ? (
        <div className="empty-compare">
          <p>Add Pokémon to compare their stats!</p>
        </div>
      ) : (
        <div className="comparison-grid">
          {compareList.map((pokemon) => (
            <div key={pokemon.id} className="compare-card">
              <button
                onClick={() => removeFromCompare(pokemon.id)}
                className="remove-compare-btn"
              >
                ×
              </button>
              <img
                src={pokemon.sprite}
                alt={pokemon.name}
                className="compare-sprite"
              />
              <h4>{capitalizeFirstLetter(pokemon.name)}</h4>
              <div className="compare-stats">
                {pokemon.stats.map((stat) => (
                  <div key={stat.stat.name} className="compare-stat">
                    <span>{stat.stat.name}: </span>
                    <strong>{stat.base_stat}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const FavoritesList = () => (
    <div className="favorites-list">
      <div className="section-header">
        <h2>❤️ Favorite Pokémon</h2>
        {favorites.length > 0 && (
          <button onClick={clearFavorites} className="clear-favorites-btn">
            Clear All
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <p>No favorite Pokémon yet. Add some by clicking the heart icon!</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((fav) => (
            <div key={fav.id} className="favorite-item">
              <img
                src={fav.sprite}
                alt={fav.name}
                className="favorite-sprite"
              />
              <h4>{capitalizeFirstLetter(fav.name)}</h4>
              <div className="favorite-types">
                {fav.types?.map((type, index) => (
                  <span
                    key={index}
                    className={`type-small type-${type.type.name}`}
                  >
                    {capitalizeFirstLetter(type.type.name)}
                  </span>
                ))}
              </div>
              <button
                onClick={() => searchPokemon(fav.name)}
                className="view-btn"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PokeDexBrowser = () => {
    const filteredPokemon = pokemonList.filter((p) => {
      if (filters.type && !p.name.includes(filters.type.toLowerCase()))
        return false;
      return true;
    });

    const indexOfLastPokemon = currentPage * pokemonPerPage;
    const indexOfFirstPokemon = indexOfLastPokemon - pokemonPerPage;
    const currentPokemon = filteredPokemon.slice(
      indexOfFirstPokemon,
      indexOfLastPokemon
    );

    return (
      <div className="pokedex-browser">
        <div className="section-header">
          <h2>📱 Pokédex Browser</h2>
          <div className="pokedex-controls">
            <input
              type="text"
              placeholder="Filter by name..."
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="filter-input"
            />
          </div>
        </div>

        <div className="pokemon-grid">
          {currentPokemon.map((pokemon, index) => {
            const pokemonId = indexOfFirstPokemon + index + 1;
            return (
              <div key={pokemonId} className="pokedex-item">
                <div className="pokedex-number">
                  #{pokemonId.toString().padStart(3, "0")}
                </div>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`}
                  alt={pokemon.name}
                  className="pokedex-sprite"
                />
                <h4>{capitalizeFirstLetter(pokemon.name)}</h4>
                <button
                  onClick={() => {
                    setActiveTab("search");
                    searchPokemon(pokemon.name);
                  }}
                  className="pokedex-view-btn"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>

        <div className="pagination">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of{" "}
            {Math.ceil(filteredPokemon.length / pokemonPerPage)}
          </span>
          <button
            onClick={() =>
              setCurrentPage(
                Math.min(
                  Math.ceil(filteredPokemon.length / pokemonPerPage),
                  currentPage + 1
                )
              )
            }
            disabled={
              currentPage >= Math.ceil(filteredPokemon.length / pokemonPerPage)
            }
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "search":
        return (
          <div className="search-tab">
            <div className="search-section">
              <div className="search-container">
                <div className="input-container">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Enter Pokémon name or ID (e.g., pikachu or 25)"
                    autoComplete="off"
                    className="pokemon-input"
                  />
                  <Suggestions />
                </div>
                <button
                  onClick={() => searchPokemon()}
                  className="search-button"
                >
                  Search
                </button>
                <button onClick={getRandomPokemon} className="random-button">
                  🎲 Random
                </button>
              </div>
            </div>

            {loading && <div className="loading">Searching...</div>}
            {error && <div className="error">{error}</div>}
            {pokemon && (
              <PokemonCard pokemon={pokemon} species={pokemonSpecies} />
            )}
          </div>
        );
      case "pokedex":
        return <PokeDexBrowser />;
      case "team":
        return <TeamBuilder />;
      case "compare":
        return <ComparisonTool />;
      case "favorites":
        return <FavoritesList />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>🔥 Ultimate Pokémon Hub</h1>
          <p>Discover, Compare, Build Teams & Battle with Pokémon</p>
        </header>

        <TabNavigation />

        <main className="main-content">{renderTabContent()}</main>
      </div>
    </div>
  );
}

export default App;
