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

 
  // get user info

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

  
  //get Favorites

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/favorites`);
      if (!response.ok) {
        throw new Error(`Failed to fetch favorites. Status: ${response.status}`);
      }

      const favorites = await response.json();
      favoritesList.innerHTML = ""; 

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

 
  // 3) Fetch Champions (5 per row, card style)

  const fetchChampions = async () => {
    try {
      const response = await fetch("/api/champions");
      if (!response.ok) {
        throw new Error(`Failed to fetch champions. Status: ${response.status}`);
      }

      let champions = await response.json();

      champions = champions.slice(0, 150);

      championsList.innerHTML = "";
      const championsContainer = document.createElement("div");
      championsContainer.classList.add("champions-cards-container");

      champions.forEach((champion) => {
       
        champion.ImageURL=`../assets/${champion.Name}.jpg`
        const placeholderImg =`../assets/${champion.Name}.jpg`;

        const card = document.createElement("div");
        card.classList.add("champion-card");

        card.innerHTML = `
          <label>
            <input
              type="checkbox"
              value="${champion.Id}"
            />
            <img src="${placeholderImg}" alt="${champion.Name} Image" />
            <div class="card-info">
              <p class="champion-name">${champion.Name}</p>
              <p class="champion-class">${champion.Class}</p>
            </div>
            <div class="checked-indicator"></div>
          </label>
        `;

        championsContainer.appendChild(card);
      });

      championsList.appendChild(championsContainer);
    } catch (error) {
      console.error("Error fetching champions:", error);
    }
  };


  // 4) Save Preferences (checked champions)

  const savePreferences = async () => {
    
    const selectedChampions = Array.from(
      document.querySelectorAll(".champion-card input[type='checkbox']:checked")
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
      fetchFavorites(); 
      location.reload(); 
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("An error occurred while saving preferences. Please try again.");
    }
  };


  // 5) Fetch Recommendations 

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/recommendations/${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching recommendations:", errorData.message);
        throw new Error(
          `Failed to fetch recommendations. Server responded with: ${errorData.message}`
        );
      }

      const { collaborative, contentBased } = await response.json();

   
      if (!Array.isArray(collaborative) || !Array.isArray(contentBased)) {
        console.error("Invalid response structure:", { collaborative, contentBased });
        recommendationsList.innerHTML = "<p>Unexpected response. Please try again later.</p>";
        return;
      }

      recommendationsList.innerHTML = "";

   
      const collabTitle = document.createElement("h3");
      collabTitle.classList.add("recommendation-subtitle");
      collabTitle.textContent = "Collaborative Recommendations";

      const collabContainer = document.createElement("div");
      collabContainer.classList.add("recommendation-cards-container");

      if (collaborative.length === 0) {
        const noCollabMsg = document.createElement("p");
        noCollabMsg.textContent = "No collaborative recommendations available.";
        recommendationsList.appendChild(collabTitle);
        recommendationsList.appendChild(noCollabMsg);
      } else {
        collaborative.forEach((champion) => {
          const card = document.createElement("div");
          card.classList.add("recommendation-card");

          const champImageURL = `../assets/${champion.Name}.jpg`;

          card.innerHTML = `
            <img src="${champImageURL}" alt="${champion.Name} Image" />
            <div class="card-info">
              <p class="champion-name">${champion.Name}</p>
              <p class="champion-class">${champion.Class || ""}</p>
            </div>
          `;
          collabContainer.appendChild(card);
        });

        recommendationsList.appendChild(collabTitle);
        recommendationsList.appendChild(collabContainer);
      }

      // ----- Content-Based Section -----
      const cbTitle = document.createElement("h3");
      cbTitle.classList.add("recommendation-subtitle");
      cbTitle.textContent = "Content-Based Recommendations";

      const cbContainer = document.createElement("div");
      cbContainer.classList.add("recommendation-cards-container");

      if (contentBased.length === 0) {
        const noCbMsg = document.createElement("p");
        noCbMsg.textContent = "No content-based recommendations available.";
        recommendationsList.appendChild(cbTitle);
        recommendationsList.appendChild(noCbMsg);
      } else {
        contentBased.forEach((champion) => {
          const card = document.createElement("div");
          card.classList.add("recommendation-card");

          const champImageURL = `../assets/${champion.Name}.jpg`;

          card.innerHTML = `
            <img src="${champImageURL}" alt="${champion.Name} Image" />
            <div class="card-info">
              <p class="champion-name">${champion.Name}</p>
              <p class="champion-class">${champion.Class || ""}</p>
            </div>
          `;
          cbContainer.appendChild(card);
        });

        recommendationsList.appendChild(cbTitle);
        recommendationsList.appendChild(cbContainer);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      alert("Unable to fetch recommendations. Please try again later.");
    }
  };

  
  // 6) Toggle Add Favorites

  addFavoritesButton.addEventListener("click", async () => {
    const championsSection = document.getElementById("champions-section");
    championsSection.classList.toggle("hidden");


    if (!championsSection.classList.contains("hidden")) {
      await fetchChampions();
    }
  });


  // 7) Logout

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



 
  savePreferencesButton.addEventListener("click", savePreferences);
  logoutButton.addEventListener("click", logoutUser);
});
