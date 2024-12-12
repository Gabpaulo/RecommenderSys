document.addEventListener("DOMContentLoaded", async () => {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    window.location.href = "/login.html";
    return;
  }

  // DOM elements
  const userNameElement = document.getElementById("user-name");
  const favoritesList = document.getElementById("favorites-list");
  const championsList = document.getElementById("champions-list");
  const recommendationsList = document.getElementById("recommendations-list");
  const addFavoritesButton = document.getElementById("add-favorites-button");
  const savePreferencesButton = document.getElementById("save-preferences");
  const logoutButton = document.getElementById("logout-button");

  // Fetch user information
  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user info. Status: ${response.status}`);
      }

      const user = await response.json();
      userNameElement.textContent = user.username || "User";
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // Fetch saved favorite champions
  const fetchFavorites = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/favorites`);
      if (!response.ok) {
        throw new Error(`Failed to fetch favorites. Status: ${response.status}`);
      }

      const favorites = await response.json();
      favoritesList.innerHTML = ""; // Clear existing favorites

      if (favorites.length === 0) {
        favoritesList.innerHTML = "<p>No favorite champions added yet.</p>";
        return;
      }

      favorites.forEach((champion) => {
        const championDiv = document.createElement("div");
        championDiv.classList.add("favorite-item");
        championDiv.textContent = `${champion.Name} (${champion.Class})`;
        favoritesList.appendChild(championDiv);
      });
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  // Fetch all champions (for adding new favorites)
  const fetchChampions = async () => {
    try {
      const response = await fetch("/api/champions");
      if (!response.ok) {
        throw new Error(`Failed to fetch champions. Status: ${response.status}`);
      }

      const champions = await response.json();
      championsList.innerHTML = ""; // Clear existing champions

      champions.forEach((champion) => {
        const championDiv = document.createElement("div");
        championDiv.classList.add("champion-item");
        championDiv.innerHTML = `
          <input type="checkbox" id="champion-${champion.Id}" value="${champion.Id}" />
          <label for="champion-${champion.Id}">${champion.Name} (${champion.Class})</label>
        `;
        championsList.appendChild(championDiv);
      });
    } catch (error) {
      console.error("Error fetching champions:", error);
    }
  };

  // Save user preferences
  const savePreferences = async () => {
    const selectedChampions = Array.from(
      document.querySelectorAll("#champions-list input:checked")
    ).map((checkbox) => parseInt(checkbox.value));

    try {
      const response = await fetch(`/api/users/${userId}/preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferences: selectedChampions }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save preferences. Status: ${response.status}`);
      }

      alert("Preferences saved successfully!");
      fetchFavorites(); // Refresh favorites
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("An error occurred while saving preferences. Please try again.");
    }

    location.reload()
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/recommendations/${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching recommendations:", errorData.message);
        throw new Error(`Failed to fetch recommendations. Server responded with: ${errorData.message}`);
      }
  
      const { collaborative, contentBased } = await response.json();
  
      // Ensure the response contains arrays
      if (!Array.isArray(collaborative) || !Array.isArray(contentBased)) {
        console.error("Invalid response structure:", { collaborative, contentBased });
        recommendationsList.innerHTML = "<p>Unexpected response. Please try again later.</p>";
        return;
      }
  
      recommendationsList.innerHTML = ""; // Clear existing recommendations
  
      // Collaborative Recommendations Section
      const collaborativeSection = document.createElement("div");
      collaborativeSection.innerHTML = "<h3>Collaborative Recommendations</h3>";
      if (collaborative.length === 0) {
        collaborativeSection.innerHTML += "<p>No collaborative recommendations available.</p>";
      } else {
        collaborative.forEach((champion) => {
          const championDiv = document.createElement("div");
          championDiv.classList.add("recommendation-item");
          championDiv.textContent = `${champion.Name} (${champion.Class})`;
          collaborativeSection.appendChild(championDiv);
        });
      }
  
      // Content-Based Recommendations Section
      const contentBasedSection = document.createElement("div");
      contentBasedSection.innerHTML = "<h3>Content-Based Recommendations</h3>";
      if (contentBased.length === 0) {
        contentBasedSection.innerHTML += "<p>No content-based recommendations available.</p>";
      } else {
        contentBased.forEach((champion) => {
          const championDiv = document.createElement("div");
          championDiv.classList.add("recommendation-item");
          championDiv.textContent = `${champion.Name} (${champion.Class})`;
          contentBasedSection.appendChild(championDiv);
        });
      }
  
      // Append both sections to the recommendations list
      recommendationsList.appendChild(collaborativeSection);
      recommendationsList.appendChild(contentBasedSection);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      alert("Unable to fetch recommendations. Please try again later.");
    }
  };
  

  // Toggle "Add New Favorites" section
  addFavoritesButton.addEventListener("click", () => {
    const championsSection = document.getElementById("champions-section");
    championsSection.classList.toggle("hidden");
    fetchChampions(); // Fetch champions only when the section is shown
  });

  // Logout user
  const logoutUser = () => {
    localStorage.removeItem("userId");
    window.location.href = "/login.html";
  };

  // Initialize Dashboard
  try {
    await fetchUserInfo();
    await fetchFavorites();
    await fetchRecommendations();
  } catch (error) {
    console.error("Error initializing dashboard:", error);
  }

  // Event listeners
  savePreferencesButton.addEventListener("click", savePreferences);
  logoutButton.addEventListener("click", logoutUser);
});
