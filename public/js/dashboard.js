const container = document.getElementById("servers-container");

fetch("/servers")
    .then((res) => res.json())
    .then((data) => {
        container.innerHTML = "";

        if (!data.servers || data.servers.length === 0) {
            container.innerHTML =
                "<p class='text-muted text-center'>No available servers found.</p>";
            return;
        }

        data.servers.forEach((server) => {
            const card = document.createElement("div");
            card.className = "col-md-4 mb-4";

            // ✅ Icon URL (fallback to default if missing)
            const iconURL = server.icon
                ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`
                : "https://cdn.discordapp.com/embed/avatars/0.png";

            // ✅ Button logic
            let buttonHTML = "";
            if (server.isBotInServer) {
                if (server.premium) {
                    buttonHTML = `<a href="/servers/${server.id}/settings" class="btn btn-primary w-100">⚙ Configure</a>`;
                } else {
                    buttonHTML = `<a href="/servers/${server.id}/buy-premium" class="btn btn-warning w-100">💳 Buy Premium</a>`;
                }
            } else {
                buttonHTML = `<a href="https://discord.com/oauth2/authorize?client_id=${data.clientId}&scope=bot&permissions=8&guild_id=${server.id}" 
                      class="btn btn-success w-100">➕ Invite Bot</a>`;
            }

            // ✅ Create card
            card.innerHTML = `
        <div class="card shadow-sm text-center border-0">
          <div class="card-body">
            <img 
              src="${iconURL}"
              class="rounded-circle mb-3 border"
              style="width: 90px; height: 90px; object-fit: cover;"
              alt="Server Icon"
            />

            <h5 class="card-title fw-bold">${server.name}</h5>
            ${server.owner
                    ? `<span class="badge bg-primary mb-2">👑 Owner</span><br>`
                    : ""
                }

            ${server.premium
                    ? `<span class="badge bg-warning text-dark mb-3">⭐ Premium</span>`
                    : `<span class="badge bg-secondary mb-3">🚫 No Premium</span>`
                }

            ${buttonHTML}
          </div>
        </div>
      `;

            container.appendChild(card);
        });
    })
    .catch((err) => {
        console.error("Error loading servers:", err);
        container.innerHTML =
            "<p class='text-danger text-center'>Error loading servers.</p>";
    });
